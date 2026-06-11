describe('Workflow Editor E2E Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/workflow/get', {
      fixture: 'workflow.json'
    }).as('getWorkflow')
    
    cy.intercept('POST', '/api/workflow/createStep', {
      statusCode: 200,
      body: { initialIndex: 999 }
    }).as('createStep')
    
    cy.intercept('POST', '/api/workflow/deleteStep', {
      statusCode: 200
    }).as('deleteStep')
    
    cy.intercept('POST', '/api/workflow/changeStepName', {
      statusCode: 200
    }).as('changeStepName')
    
    cy.intercept('POST', '/api/workflow/changeStepXY', {
      statusCode: 200
    }).as('changeStepXY')
    
    cy.visit('/')
    cy.wait('@getWorkflow')
  })

  it('should display workflow table and diagram', () => {
    cy.get('.table-wrapper').should('be.visible')
    cy.get('.diagram-container').should('be.visible')
  })

  it('should display steps in table', () => {
    cy.get('.data-table tbody tr').should('have.length.greaterThan', 0)
  })

  it('should select step on table row click', () => {
    cy.get('.data-table tbody tr').first().click()
    cy.get('.data-table tbody tr').first().should('have.class', 'selected')
  })

  it('should select step on diagram block click', () => {
    cy.get('.node').first().click()
    cy.get('.node').first().should('have.class', 'selected')
  })

  it('should add new step', () => {
    cy.get('.data-table tbody tr').then(($rows) => {
      const initialCount = $rows.length
      cy.get('.btn-add').click()
      cy.wait('@createStep')
      cy.get('.data-table tbody tr').should('have.length', initialCount + 1)
    })
  })

  it('should delete step', () => {
    cy.get('.data-table tbody tr').then(($rows) => {
      const initialCount = $rows.length
      if (initialCount > 0) {
        cy.get('.btn-delete').first().click()
        cy.wait('@deleteStep')
        cy.get('.data-table tbody tr').should('have.length', initialCount - 1)
      }
    })
  })

  it('should filter steps by search query', () => {
    cy.get('.search-box input').type('Закупка')
    cy.get('.data-table tbody tr').should('have.length', 1)
  })

  it('should zoom in', () => {
    cy.get('.tool-btn').first().click()
    cy.get('.zoom-label').should('not.contain', '100%')
  })

  it('should reset zoom', () => {
    cy.get('.tool-btn').eq(2).click()
    cy.get('.zoom-label').should('contain', '100%')
  })
})