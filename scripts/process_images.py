#!/usr/bin/env python3
"""
Enhanced Automated Screenshot-to-PWA Prototype Framework - Image Processing Script

Complete automation for:
1. Filename normalization (removes timestamps/hashes, keeps concise names)
2. Advanced status bar removal (inpainting preserves background patterns)
3. Feature-based image grouping (ORB/SIFT for robust similarity)
4. Scrollable vs static screen classification
5. Batch processing for large image sets (70-100+ images)
6. Comprehensive logging and error handling

Usage: python scripts/process_images.py
"""

import os
import re
import json
import shutil
import time
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Set
import cv2
import numpy as np
from PIL import Image
import logging

class EnhancedImageProcessor:
    def __init__(self, screens_dir: str = "src/assets/screens", batch_size: int = 15):
        self.screens_dir = Path(screens_dir)
        self.backup_dir = self.screens_dir / "backup"
        self.batch_size = batch_size
        self.processed_data = []

        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.screens_dir / "processing.log"),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

        # Create backup directory
        self.backup_dir.mkdir(exist_ok=True)

        # Initialize feature detector
        self.orb = cv2.ORB_create(nfeatures=500)
        self.bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

    def normalize_filename(self, filename: str) -> str:
        """
        Enhanced filename normalization: removes timestamps, hashes, keeps meaningful names.
        """
        stem = Path(filename).stem

        # Remove timestamp patterns: _20251215_, _20240101_123456_, etc.
        stem = re.sub(r'_20\d{2}[01]\d[0-3]\d_', '_', stem)
        stem = re.sub(r'_20\d{6}_\d+', '_', stem)

        # Remove long hash-like strings (10+ chars of mixed alphanum)
        stem = re.sub(r'[a-zA-Z0-9]{10,}', '', stem)

        # Remove special characters except underscores and letters
        stem = re.sub(r'[^a-zA-Z0-9_]', '', stem)

        # Clean multiple underscores
        stem = re.sub(r'_+', '_', stem).strip('_')

        # Remove leading/trailing numbers
        stem = re.sub(r'^[0-9_]*', '', stem)
        stem = re.sub(r'[0-9_]*$', '', stem)

        # Ensure not empty
        if not stem:
            stem = "screen"

        return stem.lower() + ".jpg"

    def detect_status_bar_region(self, image: np.ndarray) -> Tuple[int, int]:
        """
        Detect status bar region using edge detection and text analysis.
        Returns (start_y, end_y) of status bar area.
        """
        height, width = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Look for high-contrast horizontal bands (typical status bar)
        # Status bars usually have distinct color changes
        sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        sobel_y = cv2.convertScaleAbs(sobel_y)

        # Find regions with high vertical gradients (status bar borders)
        threshold = np.mean(sobel_y) + np.std(sobel_y)
        edges = (sobel_y > threshold).astype(np.uint8) * 255

        # Look at bottom 20% for status bar
        bottom_region = edges[int(height * 0.8):, :]
        horizontal_projection = np.sum(bottom_region, axis=1)

        # Find peaks in horizontal projection (status bar boundaries)
        peaks = []
        for i in range(10, len(horizontal_projection) - 10):
            if (horizontal_projection[i] > horizontal_projection[i-5:i].mean() * 1.5 and
                horizontal_projection[i] > horizontal_projection[i+1:i+6].mean() * 1.5):
                peaks.append(i + int(height * 0.8))

        if len(peaks) >= 2:
            # Assume status bar is the last significant region
            status_start = max(peaks[-2], int(height * 0.85))
            status_end = height
        else:
            # Fallback: assume bottom 15% or 100px
            status_start = height - min(100, int(height * 0.15))
            status_end = height

        return status_start, status_end

    def create_text_mask(self, image: np.ndarray, status_region: np.ndarray) -> np.ndarray:
        """
        Create mask for text/icons using multiple detection methods.
        """
        # Method 1: Color-based detection (red text common in status bars)
        hsv = cv2.cvtColor(status_region, cv2.COLOR_BGR2HSV)
        red_mask1 = cv2.inRange(hsv, (0, 30, 30), (10, 255, 255))
        red_mask2 = cv2.inRange(hsv, (160, 30, 30), (180, 255, 255))
        color_mask = cv2.bitwise_or(red_mask1, red_mask2)

        # Method 2: Edge-based text detection
        gray = cv2.cvtColor(status_region, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        edge_mask = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

        # Method 3: Adaptive thresholding for dark text on light background
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                     cv2.THRESH_BINARY_INV, 11, 2)
        thresh_mask = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        # Combine masks
        combined_mask = cv2.bitwise_or(color_mask, edge_mask)
        combined_mask = cv2.bitwise_or(combined_mask, thresh_mask)

        # Clean up mask
        kernel_clean = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel_clean)
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel_clean)

        return combined_mask

    def inpaint_status_bar(self, image: np.ndarray) -> np.ndarray:
        """
        Advanced status bar removal using inpainting to preserve background patterns.
        """
        height, width = image.shape[:2]

        # Detect status bar region
        status_start, status_end = self.detect_status_bar_region(image)
        status_height = status_end - status_start

        if status_height < 20:  # Too small to be status bar
            return image

        self.logger.info(f"  🔍 Detected status bar: y={status_start}-{status_end} ({status_height}px)")

        # Extract status bar region
        status_region = image[status_start:status_end, :, :].copy()

        # Create text/icon mask
        text_mask = self.create_text_mask(image, status_region)
        text_pixels = np.sum(text_mask > 0)

        self.logger.info(f"  📝 Detected {text_pixels} text/icon pixels to inpaint")

        if text_pixels < 100:  # Not enough text detected
            self.logger.warning("  ⚠️ Insufficient text detected, skipping inpainting")
            return image

        # Create full-size mask for inpainting
        full_mask = np.zeros((height, width), dtype=np.uint8)
        full_mask[status_start:status_end, :] = text_mask

        # Apply inpainting to preserve background patterns
        try:
            inpainted = cv2.inpaint(image, full_mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
            self.logger.info("  ✅ Inpainting completed successfully")
            return inpainted
        except Exception as e:
            self.logger.error(f"  ❌ Inpainting failed: {e}")
            # Fallback: simple fill with sampled background
            return self.fallback_status_bar_removal(image, status_start, status_end)

    def fallback_status_bar_removal(self, image: np.ndarray, status_start: int, status_end: int) -> np.ndarray:
        """
        Fallback method: sample background and fill text areas.
        """
        try:
            # Sample background from above status bar
            sample_height = 30
            sample_start = max(0, status_start - sample_height)
            sample_region = image[sample_start:status_start, :, :]
            background_color = cv2.mean(sample_region)[:3]

            # Simple fill (less sophisticated but works)
            status_region = image[status_start:status_end, :, :]
            gray = cv2.cvtColor(status_region, cv2.COLOR_BGR2GRAY)
            _, text_mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

            status_region[text_mask > 0] = background_color
            image[status_start:status_end, :, :] = status_region

            self.logger.info("  ✅ Fallback status bar removal completed")
            return image
        except Exception as e:
            self.logger.error(f"  ❌ Fallback removal failed: {e}")
            return image

    def extract_features(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Extract ORB features and descriptors from image.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        keypoints, descriptors = self.orb.detectAndCompute(gray, None)

        if descriptors is None:
            # Fallback: return histogram features
            hist = cv2.calcHist([image], [0, 1, 2], None, [8, 8, 8],
                              [0, 256, 0, 256, 0, 256])
            hist = cv2.normalize(hist, hist).flatten()
            return np.array([]), hist.reshape(1, -1)

        return keypoints, descriptors

    def calculate_feature_similarity(self, desc1: np.ndarray, desc2: np.ndarray) -> float:
        """
        Calculate similarity using feature matching (ORB descriptors).
        """
        if desc1.size == 0 or desc2.size == 0:
            return 0.0

        try:
            matches = self.bf.match(desc1, desc2)
            if len(matches) == 0:
                return 0.0

            # Use ratio of good matches to total possible matches
            distances = [m.distance for m in matches]
            good_matches = sum(1 for d in distances if d < 50)  # Distance threshold

            # Normalize by minimum descriptor count
            min_descriptors = min(len(desc1), len(desc2))
            similarity = good_matches / min_descriptors if min_descriptors > 0 else 0

            return min(similarity, 1.0)
        except Exception as e:
            self.logger.warning(f"Feature matching failed: {e}")
            return 0.0

    def calculate_histogram_similarity(self, img1: np.ndarray, img2: np.ndarray) -> float:
        """
        Fallback histogram similarity calculation.
        """
        try:
            hist1 = cv2.calcHist([img1], [0, 1, 2], None, [8, 8, 8],
                               [0, 256, 0, 256, 0, 256])
            hist2 = cv2.calcHist([img2], [0, 1, 2], None, [8, 8, 8],
                               [0, 256, 0, 256, 0, 256])

            hist1 = cv2.normalize(hist1, hist1).flatten()
            hist2 = cv2.normalize(hist2, hist2).flatten()

            similarity = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
            return max(0, similarity)
        except Exception as e:
            return 0.0

    def is_scrollable_screen(self, image: np.ndarray, similar_images: List[np.ndarray],
                           group_size: int) -> bool:
        """
        Enhanced scrollable detection using feature analysis and heuristics.
        """
        if group_size < 3:
            return False

        height, width = image.shape[:2]

        # Feature-based similarity analysis
        _, desc1 = self.extract_features(image)
        similarities = []

        for other_img in similar_images:
            _, desc2 = self.extract_features(other_img)
            if desc1.size > 0 and desc2.size > 0:
                sim = self.calculate_feature_similarity(desc1, desc2)
            else:
                sim = self.calculate_histogram_similarity(image, other_img)
            similarities.append(sim)

        avg_similarity = np.mean(similarities) if similarities else 0

        # Content analysis: check for scrollable patterns
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        bottom_region = gray[int(height * 0.75):, :]

        # Look for content cutoff patterns (fade, cutoff text, etc.)
        bottom_std = np.std(bottom_region)
        bottom_mean = np.mean(bottom_region)

        # Scrollable indicators
        has_content_cutoff = bottom_std > 25  # Varied content near bottom
        high_similarity = avg_similarity > 0.4  # Good feature matches
        sufficient_group = group_size >= 3  # Multiple similar screens

        is_scrollable = high_similarity and (has_content_cutoff or sufficient_group)

        self.logger.info(f"  📊 Scrollable analysis: sim={avg_similarity:.2f}, "
                        f"content_std={bottom_std:.1f}, group_size={group_size}, "
                        f"scrollable={is_scrollable}")

        return is_scrollable

    def group_related_images(self, images: Dict[str, np.ndarray]) -> Dict[str, List[str]]:
        """
        Enhanced grouping using feature matching for better accuracy.
        """
        groups = {}
        processed: Set[str] = set()

        for filename, image in images.items():
            if filename in processed:
                continue

            group_name = Path(filename).stem
            group = [filename]
            processed.add(filename)

            # Extract features for this image
            _, desc1 = self.extract_features(image)

            # Find similar images
            for other_filename, other_image in images.items():
                if other_filename in processed:
                    continue

                _, desc2 = self.extract_features(other_image)

                # Calculate similarity
                if desc1.size > 0 and desc2.size > 0:
                    similarity = self.calculate_feature_similarity(desc1, desc2)
                else:
                    similarity = self.calculate_histogram_similarity(image, other_image)

                # Group threshold: lower for feature matching
                if similarity > 0.3:
                    group.append(other_filename)
                    processed.add(other_filename)

            groups[group_name] = group

        return groups

    def process_image_batch(self, image_batch: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """
        Process a batch of images with status bar removal.
        """
        processed = {}

        for filename, image in image_batch.items():
            try:
                self.logger.info(f"🔄 Processing: {filename} ({image.shape})")

                # Apply advanced status bar inpainting
                cleaned_image = self.inpaint_status_bar(image)

                # Normalize filename
                new_filename = self.normalize_filename(filename)

                # Handle duplicates
                counter = 1
                original_name = new_filename
                while new_filename in processed:
                    name_part = Path(original_name).stem
                    ext = Path(original_name).suffix
                    new_filename = f"{name_part}_{counter}{ext}"
                    counter += 1

                processed[new_filename] = cleaned_image

                self.logger.info(f"  ✅ Processed: {filename} -> {new_filename}")

            except Exception as e:
                self.logger.error(f"  ❌ Failed to process {filename}: {e}")
                # Keep original on failure
                processed[filename] = image

        return processed

    def load_images_batch(self, image_files: List[Path], start_idx: int, batch_size: int) -> Dict[str, np.ndarray]:
        """
        Load a batch of images to avoid memory issues.
        """
        batch = {}
        end_idx = min(start_idx + batch_size, len(image_files))

        for i in range(start_idx, end_idx):
            img_file = image_files[i]
            try:
                img = cv2.imread(str(img_file))
                if img is not None:
                    batch[img_file.name] = img
                    self.logger.info(f"✅ Loaded: {img_file.name}")
                else:
                    self.logger.warning(f"❌ Failed to load: {img_file.name}")
            except Exception as e:
                self.logger.error(f"❌ Error loading {img_file.name}: {e}")

        return batch

    def process_all_images(self) -> Dict[str, int]:
        """
        Main batched processing pipeline with comprehensive logging.
        """
        self.logger.info("🚀 Starting enhanced automated image processing...")

        # Get all image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
        image_files = [
            f for f in self.screens_dir.iterdir()
            if f.is_file() and f.suffix.lower() in image_extensions
        ]

        if not image_files:
            self.logger.error("❌ No image files found in screens directory")
            return {}

        self.logger.info(f"📁 Found {len(image_files)} images to process")

        # Step 1: Backup all original images
        self.logger.info("💾 Creating backup of original images...")
        for img_file in image_files:
            dst = self.backup_dir / img_file.name
            shutil.copy2(img_file, dst)
        self.logger.info(f"✅ Backup completed: {len(image_files)} files")

        # Step 2: Process images in batches
        all_processed_images = {}
        total_batches = (len(image_files) + self.batch_size - 1) // self.batch_size

        for batch_idx in range(total_batches):
            start_idx = batch_idx * self.batch_size
            self.logger.info(f"🔄 Processing batch {batch_idx + 1}/{total_batches} "
                           f"(images {start_idx + 1}-{min(start_idx + self.batch_size, len(image_files))})")

            # Load batch
            batch_images = self.load_images_batch(image_files, start_idx, self.batch_size)

            # Process batch
            processed_batch = self.process_image_batch(batch_images)

            # Save processed images
            for filename, image in processed_batch.items():
                output_path = self.screens_dir / filename
                cv2.imwrite(str(output_path), image)
                all_processed_images[filename] = image

            self.logger.info(f"✅ Batch {batch_idx + 1} completed: {len(processed_batch)} images")

        # Step 3: Group all processed images
        self.logger.info("🔗 Grouping related images using feature matching...")
        groups = self.group_related_images(all_processed_images)
        self.logger.info(f"📊 Created {len(groups)} groups from {len(all_processed_images)} images")

        # Step 4: Generate screens.json
        self.logger.info("📝 Generating screens.json...")
        screens_data = []
        stats = {"static": 0, "scrollable": 0}

        for group_name, filenames in groups.items():
            group_size = len(filenames)

            if group_size == 1:
                # Single static screen
                filename = filenames[0]
                screen_data = {
                    "src": f"assets/screens/{filename}",
                    "id": Path(filename).stem,
                    "type": "static"
                }
                screens_data.append(screen_data)
                stats["static"] += 1
                self.logger.info(f"  📄 Static: {filename}")

            else:
                # Multiple images - analyze for scrollable
                sample_image = all_processed_images[filenames[0]]
                other_images = [all_processed_images[f] for f in filenames[1:]]

                is_scrollable = self.is_scrollable_screen(sample_image, other_images, group_size)

                if is_scrollable:
                    screen_data = {
                        "src": f"assets/screens/{filenames[0]}",
                        "id": group_name,
                        "type": "scrollable",
                        "images": [f"assets/screens/{f}" for f in filenames],
                        "pinnedHeaderHeight": "15%"
                    }
                    stats["scrollable"] += 1
                    self.logger.info(f"  📜 Scrollable: {group_name} ({group_size} images)")
                else:
                    # Multiple static screens
                    for filename in filenames:
                        screen_data = {
                            "src": f"assets/screens/{filename}",
                            "id": f"{group_name}_{Path(filename).stem}",
                            "type": "static"
                        }
                        screens_data.append(screen_data)
                        stats["static"] += 1
                    self.logger.info(f"  📄 Multiple static: {group_name} ({group_size} images)")

        # Save screens.json
        screens_json_path = self.screens_dir / "screens.json"
        with open(screens_json_path, 'w', encoding='utf-8') as f:
            json.dump(screens_data, f, indent=2, ensure_ascii=False)

        self.logger.info("✅ Processing complete!")
        self.logger.info(f"📊 Generated {len(screens_data)} screen configurations")
        self.logger.info(f"📈 Stats: {stats['static']} static, {stats['scrollable']} scrollable screens")
        self.logger.info(f"💾 Backup saved to: {self.backup_dir}")
        self.logger.info(f"📄 screens.json saved to: {screens_json_path}")

        return stats

def main():
    """Main entry point with enhanced processing."""
    print("🎯 Enhanced Screenshot-to-PWA Prototype Framework - Automated Image Processor")
    print("=" * 80)

    start_time = time.time()

    processor = EnhancedImageProcessor(batch_size=15)  # Process 15 images at a time
    stats = processor.process_all_images()

    elapsed_time = time.time() - start_time
    print(f"\n⏱️ Processing completed in {elapsed_time:.1f} seconds")
    print(f"📊 Final stats: {stats.get('static', 0)} static, {stats.get('scrollable', 0)} scrollable screens")
    print("\n🎉 All done! Your screenshots are fully processed and ready for PWA prototyping.")

if __name__ == "__main__":
    main()
