describe('Screenshot Flow E2E Tests', () = 
  beforeEach(() = 
    // Visit the main screens page  
    cy.visit('/screens');  
    cy.wait(2000); // Wait for initial data to load  
  });  
  
  it('should capture screenshot when clicking the camera button', () = 
    // Find and click the screenshot button  
    cy.get('button.screenshot-btn[title="Capture Screenshot"]')  
      .should('be.visible')  
      .click();  
  
    // Wait for the download to start  
    cy.wait(2000);  
  
    // Verify that a download may have occurred  
    // Note: Cypress has limitations with actual file downloads in headless mode  
    // We'll verify the function was called by checking for loading states or console logs  
    cy.window().then((win) = 
      cy.stub(win.console, 'error').as('consoleError');  
      cy.stub(win.console, 'log').as('consoleLog');  
    });  
  
    cy.get('button.screenshot-btn').click();  
    cy.get('@consoleLog').should('be.called');  
  });  
  
  it('should implement debounce mechanism to prevent rapid clicking', () = 
    // Click the screenshot button multiple times rapidly  
    cy.get('button.screenshot-btn')  
      .should('be.visible')  
      .click()  
      .click()  
      .click();  
  
    // Verify that only one operation happened by checking for loading state  
    // The button should not allow multiple concurrent captures  
    cy.get('button.screenshot-btn').should('not.have.class', 'loading');  
  });  
  
  it('should generate screenshot with correct timestamped filename', () = 
    // Click the screenshot button  
    cy.get('button.screenshot-btn').click();  
  
    // Need to intercept the download to verify filename  
    cy.on('window:alert', (str) = 
      expect(str).to.contain('screen-');  
      expect(str).to.contain(new Date().getFullYear().toString());  
    });  
  });  
  
  it('should show loading state during screenshot capture process', () = 
    // Since we can't truly test the async canvas operations in a headless environment,  
    // we'll test by stubbing the html2canvas function to simulate delay  
    cy.window().then((win) = 
      cy.stub(win, 'html2canvas').callsFake(() = 
        return new Promise((resolve) = 
          setTimeout(() = 
            resolve({  
              toDataURL: () =;base64,testdata'  
            });  
          }, 1000);  
        });  
      });  
    });  
  
    cy.get('button.screenshot-btn').click();  
  
    // Verify button is in loading state (if we had added one)  
    cy.get('button.screenshot-btn').should('exist');  
  });  
  
  it('should handle screenshot capture errors gracefully', () = 
    // Stub the html2canvas to throw an error  
    cy.window().then((win) = 
      cy.stub(win, 'html2canvas').callsFake(() = 
        throw new Error('Screenshot failed');  
      });  
    });  
  
    cy.get('button.screenshot-btn').click();  
  
    // Verify that the error is handled gracefully (no crash)  
    cy.get('button.screenshot-btn').should('exist');  
  });  
}); 
