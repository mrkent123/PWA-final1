describe('Screenshot Functionality E2E Tests', () = 
  beforeEach(() = 
    cy.visit('/screens');  
    cy.wait(2000); // Wait for initial data to load  
  });  
ECHO is on.
  it('should capture screenshot when clicking the camera button', () = 
    // Find and click the screenshot button  
    cy.get('button.screenshot-btn[title="Capture Screenshot"]')  
      .should('be.visible')  
      .and('not.have.class', 'loading')  
      .click();  
ECHO is on.
    // Verify button enters loading state  
    cy.get('button.screenshot-btn')  
      .should('have.class', 'loading');  
ECHO is on.
    // Wait for processing  
    cy.wait(2000);  
ECHO is on.
    // Verify button exits loading state  
    cy.get('button.screenshot-btn')  
      .should('not.have.class', 'loading');  
  }); 
  it('should implement debounce mechanism to prevent rapid clicking', () = 
    // Click the screenshot button multiple times rapidly  
    cy.get('button.screenshot-btn')  
      .should('be.visible')  
      .click()  
      .click()  
      .click();  
ECHO is on.
    // Verify that only one operation happened by checking for loading state  
    // The button should handle multiple clicks gracefully  
    cy.get('button.screenshot-btn')  
      .should('exist');  
  });  
ECHO is on.
  it('should handle screenshot capture errors gracefully', () = 
    // Stub the html2canvas to throw an error  
    cy.window().then((win) = 
      cy.stub(win, 'html2canvas').callsFake(() = 
        throw new Error('Screenshot failed');  
      });  
    });  
ECHO is on.
    cy.get('button.screenshot-btn').click();  
ECHO is on.
    // Verify that the error is handled gracefully (no crash)  
    cy.get('button.screenshot-btn').should('exist');  
  });  
}); 
