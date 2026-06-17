describe('Microfrontend layout', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load table microfrontend', () => {
    // Wait for the table container to have some content (e.g., table header)
    cy.get('#table-container')
      .should('exist')
      .within(() => {
        cy.contains('Структура рабочего процесса').should('be.visible')
      })
  })

  it('should load diagram microfrontend', () => {
    cy.get('#diagram-container')
      .should('exist')
      .within(() => {
        cy.contains('Приблизить').should('be.visible') // toolbar button title
      })
  })

  it('should allow selecting a step in table and highlight in diagram', () => {
    // This would require inter-microfrontend communication via events
    // For now, we just click a step in table and check that diagram gets a selected class
    cy.get('#table-container')
      .find('tbody tr')
      .first()
      .click()
    // The diagram should have a selected node
    cy.get('#diagram-container')
      .find('.node.selected')
      .should('exist')
  })
})