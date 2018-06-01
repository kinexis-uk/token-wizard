import React from 'react'
import { inject, observer } from 'mobx-react'
import { Field, FormSpy } from 'react-final-form'
import { CONTRIBUTION_OPTIONS } from '../../utils/constants'
import { InputField2 } from '../Common/InputField2'
import {
  composeValidators,
  isDecimalPlacesNotGreaterThan,
  isGreaterOrEqualThan,
  isRequired
} from '../../utils/validations'
import classNames from 'classnames'

export const ContributeForm = inject('contributeStore', 'tokenStore')
(observer(({ contributeStore, tokenStore, handleSubmit, pristine, invalid, ...props}) => {
  const { decimals } = tokenStore
  const { investThrough, updateInvestThrough, web3Available } = props

  const contributeButtonClasses = classNames('button', 'button_fill', {
    'button_disabled': pristine || invalid
  })

  const ContributeButton = investThrough === CONTRIBUTION_OPTIONS.METAMASK ?
    <a className={contributeButtonClasses} onClick={handleSubmit}>Contribute</a> : null

  const validateInvest = (value) => {
    const decimalsErr = `Number of tokens to buy should be positive and should not exceed ${decimals} decimals.`
    const minimumContributionErr = `Minimum valid contribution: ${props.minimumContribution}`
    const errors = composeValidators(
      isRequired(),
      isDecimalPlacesNotGreaterThan(decimalsErr)(decimals),
      isGreaterOrEqualThan(minimumContributionErr)(props.minimumContribution)
    )(value)
    if (errors) return errors.shift()
  }

  const tokensToInvestOnChange = ({ values }) => {
    if (values && values.invest !== undefined) {
      contributeStore.setProperty('tokensToInvest', values.invest)
    }
  }

  return (
    <form className="invest-form" onSubmit={handleSubmit}>
      <label className="invest-form-label">Choose amount to invest</label>

      <div className="invest-form-input-container">
        <Field
          name="invest"
          component={InputField2}
          validate={validateInvest}
          placeholder="0"
          inputClassName="invest-form-input"
        />
        <FormSpy subscription={{ values: true }} onChange={tokensToInvestOnChange}/>
        <div className="invest-form-label">TOKENS</div>
      </div>

      <div className="invest-through-container">
        <select value={investThrough} className="invest-through" onChange={(e) => updateInvestThrough(e.target.value)}>
          <option disabled={!web3Available} value={CONTRIBUTION_OPTIONS.METAMASK}>
            Metamask {!web3Available ? ' (not available)' : null}</option>
          <option value={CONTRIBUTION_OPTIONS.QR}>QR</option>
        </select>
        {ContributeButton}
      </div>

      <p className="description">
        Think twice before contributing to Crowdsales. Tokens will be deposited on a wallet you used to buy tokens.
      </p>
    </form>
  )
}))
