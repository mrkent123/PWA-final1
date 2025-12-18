describe('Keyboard Functionality E2E Tests', () = 
  beforeEach(() = 
    cy.visit('/screens');  
    cy.wait(2000); // Wait for initial data to load  
  });  
ECHO is on.
  it('should display iOS keyboard when clicking on input hotspot', () = 
    // Click on MST input field (number type) - first input hotspot  
    cy.get('.hotspot.input-hotspot').eq(0).click();  
ECHO is on.
    // Verify iOS keyboard container is visible  
    cy.get('.ios-keyboard-container').should('have.class', 'visible');  
ECHO is on.
    // Verify preview bar is shown with correct placeholder  
    cy.get('.keyboard-preview').should('be.visible');  
ECHO is on.
    // Verify keyboard wrapper has slide-up animation  
    cy.get('.keyboard-wrapper').should('have.class', 'slide-up');  
  }); 
  it('should handle typing functionality through virtual keyboard', () = 
    // Click on MST input field - first input hotspot  
    cy.get('.hotspot.input-hotspot').eq(0).click();  
ECHO is on.
    // Type using the keyboard input (simulate virtual keyboard input)  
    cy.get('#ios-keyboard-container').type('123456789');  
ECHO is on.
    // Verify the preview value updates  
    cy.get('.preview-value').should('contain', '123456789');  
  });  
ECHO is on.
  it('should close keyboard when clicking close button', () = 
    // Click on input field - first input hotspot  
    cy.get('.hotspot.input-hotspot').eq(0).click();  
    cy.get('.ios-keyboard-container').should('have.class', 'visible');  
ECHO is on.
    // Click the close button  
    cy.get('.preview-close').click();  
ECHO is on.
    // Verify keyboard is hidden  
    cy.get('.ios-keyboard-container').should('not.have.class', 'visible');  
    cy.get('.keyboard-overlay').should('not.have.class', 'visible');  
  });  
}); 
