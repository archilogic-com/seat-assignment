/// <reference types="cypress" />

context('Actions', () => {
  describe('Smoke Test', () => {
    it('Visit', () => {
      cy.visit('localhost:3000')
    })
    it('2D loaded', () => {
      cy.get('canvas')
    })
  })
})

