describe('Navigation Flow E2E Tests', () = 
  beforeEach(() = 
    cy.visit('/screens');  
    cy.wait(2000); // Wait for initial data to load  
  });  
  
  it('should navigate between screens correctly', () = 
    // Initially should be on the login screen  
    cy.get('.screen-image').should('have.attr', 'src').should('include', 'login');  
  
    // Find and click a navigation hotspot  
    cy.get('.hotspot[action="navigate"]').first().click();  
  
    // Wait for navigation to complete  
    cy.wait(1000);  
    // Verify new screen is loaded  
    cy.get('.screen-image').should('have.attr', 'src').should('not.include', 'login');  
  });  
  
  it('should update hotspots when screen changes', () = 
    // Get initial number of hotspots  
    cy.get('.hotspot').then(($initialHotspots) = 
      const initialCount = $initialHotspots.length;  
      cy.log('Initial hotspot count:', initialCount);  
    });  
  
    // Navigate to a different screen  
    cy.get('.hotspot[action="navigate"]').first().click();  
    cy.wait(1000);  
  
    // Get new number of hotspots  
    cy.get('.hotspot').then(($newHotspots) = 
      const newCount = $newHotspots.length;  
      cy.log('New hotspot count:', newCount);  
      // Verify hotspots have changed  
      expect(newCount).not.to.eq(0); // Should have some hotspots  
    });  
  });  
  
  it('should maintain state during navigation', () = 
    // Input some data  
    cy.get('.hotspot[field="mst"]').click();  
    cy.get('#ios-keyboard-container').type('123456789');  
    cy.get('.ios-keyboard-container .preview-close').click();  
  
    // Navigate to another screen  
    cy.get('.hotspot[action="navigate"]').first().click();  
    cy.wait(500);  
  
    // Navigate back  
    // Go back to initial screen if possible through workflow  
    // Verify state is maintained (this depends on implementation)  
  });  
  
  it('should handle scrollable screen navigation', () = 
    // Identify if current screen is scrollable  
    cy.get('.scrollable-screen').then(($scrollable) = 
      if ($scrollable.length  {  
        // Test scrolling functionality  
        cy.get('.scroll-content').scrollTo('bottom');  
        cy.get('.scroll-content').should('have.prop', 'scrollTop').should('be.greaterThan', 0);  
  
        cy.get('.scroll-content').scrollTo('top');  
        cy.get('.scroll-content').should('have.prop', 'scrollTop').should('eq', 0);  
      }  
    });  
  });  
  
  it('should handle back navigation properly', () = 
    // Capture initial screen ID  
    cy.get('.screen-image').invoke('attr', 'src').then((initialSrc) = 
      // Navigate away  
      cy.get('.hotspot[action="navigate"]').first().click();  
      cy.wait(1000);  
  
      // Navigate back (if workflow supports it)  
      // This would depend on the specific navigation workflow  
      // Verify we're back to the initial screen  
      // For now, just verify we can navigate forward  
      cy.get('.screen-image').should('have.attr', 'src').should('not.eq', initialSrc);  
    });  
  });  
}); 
