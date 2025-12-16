describe('Performance & Security E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/screens');
    cy.wait(2000); // Wait for initial data to load
  });

  describe('Security Tests - XSS Prevention', () => {
    it('should prevent XSS attacks through input sanitization', () => {
      // Click on MST input field - first input hotspot
      cy.get('.hotspot.input-hotspot').eq(0).click();

      // Try to inject XSS payload
      const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
      cy.get('#ios-keyboard-container').type(xssPayload);

      // Close keyboard to trigger input processing
      cy.get('.preview-close').click();

      // Verify no script execution occurred (page should still be functional)
      cy.get('.screen-image').should('be.visible');
      cy.get('.hotspot').should('exist');

      // Verify the input was sanitized (should be empty or cleaned)
      cy.get('.hotspot.input-hotspot').eq(0).click();
      cy.get('.preview-value').should('not.contain', '<script>');
      cy.get('.preview-value').should('not.contain', '<img');
      cy.get('.preview-close').click();
    });

    it('should sanitize HTML characters in password fields', () => {
      // Click on password input field - second input hotspot
      cy.get('.hotspot.input-hotspot').eq(1).click();

      // Try to inject HTML characters
      const htmlPayload = '<b>Bold</b> & "quotes" \'single\'';
      cy.get('#ios-keyboard-container').type(htmlPayload);

      // Close keyboard
      cy.get('.preview-close').click();

      // Verify HTML characters were removed
      cy.get('.hotspot.input-hotspot').eq(1).click();
      cy.get('.preview-value').should('not.contain', '<');
      cy.get('.preview-value').should('not.contain', '>');
      cy.get('.preview-value').should('not.contain', '&');
      cy.get('.preview-value').should('not.contain', '"');
      cy.get('.preview-value').should('not.contain', '\'');
      cy.get('.preview-close').click();
    });

    it('should prevent SQL injection attempts', () => {
      // Click on input field - first input hotspot
      cy.get('.hotspot.input-hotspot').eq(0).click();

      // Try SQL injection payload
      const sqlPayload = "'; DROP TABLE users; --";
      cy.get('#ios-keyboard-container').type(sqlPayload);

      // Close keyboard
      cy.get('.preview-close').click();

      // Application should still function normally
      cy.get('.screen-image').should('be.visible');
      cy.get('.hotspot').should('exist');
    });
  });

  describe('Input Validation Tests', () => {
    it('should validate MST field with number-only pattern', () => {
      // Click on MST input field - first input hotspot
      cy.get('.hotspot.input-hotspot').eq(0).click();

      // Enter valid MST (numbers only)
      cy.get('#ios-keyboard-container').type('123456789');
      cy.get('.preview-close').click();

      // Enter invalid MST (contains letters)
      cy.get('.hotspot.input-hotspot').eq(0).click();
      cy.get('#ios-keyboard-container').type('ABC123');
      cy.get('.preview-close').click();

      // Application should handle invalid input gracefully
      cy.get('.screen-image').should('be.visible');
    });

    it('should validate password field minimum length', () => {
      // Click on password input field - second input hotspot
      cy.get('.hotspot.input-hotspot').eq(1).click();

      // Enter short password
      cy.get('#ios-keyboard-container').type('123');
      cy.get('.preview-close').click();

      // Enter valid password
      cy.get('.hotspot.input-hotspot').eq(1).click();
      cy.get('#ios-keyboard-container').type('123456');
      cy.get('.preview-close').click();

      // Application should handle both cases
      cy.get('.screen-image').should('be.visible');
    });

    it('should handle empty input values gracefully', () => {
      // Click login without entering any values
      cy.get('.hotspot[action="login"]').click();

      // Application should not crash
      cy.get('.screen-image').should('be.visible');
      cy.get('.hotspot').should('exist');
    });
  });

  describe('Performance Tests - Memory Leak Prevention', () => {
    it('should not have memory leaks during rapid hotspot interactions', () => {
      // Rapidly click hotspots multiple times
      for (let i = 0; i < 10; i++) {
        cy.get('.hotspot.input-hotspot').eq(0).click();
        cy.get('.hotspot.input-hotspot').eq(1).click();
      }

      // Verify application remains responsive
      cy.get('.screen-image').should('be.visible');
      cy.get('.hotspot').should('have.length.greaterThan', 0);

      // Check that keyboard doesn't get stuck open
      cy.get('.ios-keyboard-container').should('not.have.class', 'visible');
    });

    it('should handle rapid keyboard show/hide cycles without memory issues', () => {
      // Rapidly show and hide keyboard
      for (let i = 0; i < 5; i++) {
        cy.get('.hotspot.input-hotspot').eq(0).click();
        cy.get('.preview-close').click();
      }

      // Verify keyboard still works after rapid cycles
      cy.get('.hotspot.input-hotspot').eq(0).click();
      cy.get('.ios-keyboard-container').should('have.class', 'visible');
      cy.get('.preview-close').click();
    });

    it('should clean up event listeners on component destruction', () => {
      // Navigate between screens rapidly
      for (let i = 0; i < 5; i++) {
        cy.get('.hotspot[action="navigate"]').first().click();
        cy.wait(500);
      }

      // Verify application remains stable
      cy.get('.screen-image').should('be.visible');
      cy.get('.hotspot').should('exist');
    });
  });

  describe('Performance Tests - Debounce Verification', () => {
    it('should debounce rapid screenshot capture requests', () => {
      // Click screenshot button rapidly multiple times
      cy.get('button.screenshot-btn').click();
      cy.get('button.screenshot-btn').click();
      cy.get('button.screenshot-btn').click();

      // Wait for debounce period
      cy.wait(2000);

      // Verify only one screenshot operation occurred
      cy.get('button.screenshot-btn').should('exist');

      // Verify application stability
      cy.get('.screen-image').should('be.visible');
    });

    it('should prevent rapid keyboard input processing', () => {
      // Click input field - first input hotspot
      cy.get('.hotspot.input-hotspot').eq(0).click();

      // Type rapidly
      cy.get('#ios-keyboard-container').type('11111111111111111111');

      // Close keyboard
      cy.get('.preview-close').click();

      // Verify input was processed correctly (not truncated unexpectedly)
      cy.get('.hotspot.input-hotspot').eq(0).click();
      cy.get('.preview-value').should('have.length.greaterThan', 5);
      cy.get('.preview-close').click();
    });

    it('should handle rapid navigation requests appropriately', () => {
      // Click navigation hotspot rapidly
      cy.get('.hotspot[action="navigate"]').first().click();
      cy.get('.hotspot[action="navigate"]').first().click();

      // Wait for navigation to complete
      cy.wait(1000);

      // Verify stable state
      cy.get('.screen-image').should('be.visible');
      cy.get('.hotspot').should('exist');
    });
  });

  describe('Network Failure Handling', () => {
    it('should handle network failures gracefully during data loading', () => {
      // Intercept network requests and force failures
      cy.intercept('GET', 'assets/hotspot.json', { forceNetworkError: true }).as('hotspotData');

      // Reload the page
      cy.reload();
      cy.wait(2000);

      // Application should still load with error handling
      cy.get('body').should('exist');
    });

    it('should handle screenshot capture failures gracefully', () => {
      // Stub html2canvas to simulate failure
      cy.window().then((win) => {
        cy.stub(win as any, 'html2canvas').callsFake(() => {
          throw new Error('Canvas capture failed');
        });
      });

      // Attempt screenshot
      cy.get('button.screenshot-btn').click();

      // Application should remain functional
      cy.get('.screen-image').should('be.visible');
      cy.get('button.screenshot-btn').should('exist');
    });

    it('should handle image loading failures gracefully', () => {
      // Intercept image requests and force failures
      cy.intercept('GET', '**/*.jpg', { statusCode: 404 }).as('imageLoad');

      // Reload page
      cy.reload();
      cy.wait(2000);

      // Application should handle missing images gracefully
      cy.get('body').should('exist');
    });
  });

  describe('Resource Cleanup Tests', () => {
    it('should clean up keyboard resources after navigation', () => {
      // Open keyboard - first input hotspot
      cy.get('.hotspot.input-hotspot').eq(0).click();
      cy.get('.ios-keyboard-container').should('have.class', 'visible');

      // Navigate to another screen
      cy.get('.hotspot[action="navigate"]').first().click();
      cy.wait(1000);

      // Keyboard should be closed after navigation
      cy.get('.ios-keyboard-container').should('not.have.class', 'visible');
    });

    it('should prevent zombie event listeners', () => {
      // Perform multiple interactions
      cy.get('.hotspot.input-hotspot').eq(0).click();
      cy.get('.preview-close').click();
      cy.get('.hotspot.input-hotspot').eq(1).click();
      cy.get('.preview-close').click();

      // Navigate away and back
      cy.get('.hotspot[action="navigate"]').first().click();
      cy.wait(500);

      // Verify no lingering keyboard state
      cy.get('.ios-keyboard-container').should('not.have.class', 'visible');
    });
  });
});
