import React, { Component } from 'react'
import logdown from 'logdown'
import { ButtonContinue } from '../Common/ButtonContinue'
import { Loader } from '../Common/Loader'
import { NAVIGATION_STEPS, CROWDSALE_STRATEGIES, DOWNLOAD_STATUS } from '../../utils/constants'
import { StepInfo } from '../Common/StepInfo'
import { StepNavigation } from '../Common/StepNavigation'
import { StrategyItem } from './StrategyItem'
import { checkWeb3ForErrors } from '../../utils/blockchainHelpers'
import { clearStorage, navigateTo } from '../../utils/utils'
import { inject, observer } from 'mobx-react'
import { reloadStorage } from '../Home/utils'
import { strategies } from '../../utils/strategies'

const logger = logdown('TW:StepOne')
const { CROWDSALE_STRATEGY } = NAVIGATION_STEPS
const { MINTED_CAPPED_CROWDSALE } = CROWDSALE_STRATEGIES

@inject(
  'web3Store',
  'generalStore',
  'contractStore',
  'crowdsaleStore',
  'gasPriceStore',
  'deploymentStore',
  'reservedTokenStore',
  'stepTwoValidationStore',
  'tierStore',
  'tokenStore'
)
@observer
export class StepOne extends Component {
  state = {
    loading: true,
    strategy: null
  }

  async componentDidMount() {
    window.addEventListener('beforeunload', () => {
      navigateTo({
        history: this.props.history,
        location: 'stepOne'
      })
    })

    // Capture back button to clear fromLocation
    window.addEventListener(
      'popstate',
      event => {
        if (event.state) {
          this.props.history.replace({
            state: {
              fromLocation: null
            }
          })
        }
      },
      false
    )

    try {
      await checkWeb3ForErrors(result => {
        navigateTo({
          history: this.props.history,
          location: 'home'
        })
      })

      const { strategy } = await this.load()
      this.setState({ strategy: strategy })
    } catch (e) {
      logger.log('An error has occurred', e.message)
    }

    this.setState({ loading: false })
  }

  async load() {
    const { crowdsaleStore } = this.props
    // Reload storage
    const { state } = this.props.history.location

    logger.log(`From location ${state && state.fromLocation ? state.fromLocation : null}`)
    if (state && state.fromLocation && state.fromLocation === 'home') {
      clearStorage(this.props)
      await reloadStorage(this.props)

      // Set fromLocation to null, there is a glitch from the back button of the browser
      this.props.history.push({
        state: {
          fromLocation: null
        }
      })
    }

    // Set default strategy value
    const strategy = crowdsaleStore && crowdsaleStore.strategy ? crowdsaleStore.strategy : MINTED_CAPPED_CROWDSALE

    logger.log('CrowdsaleStore strategy', strategy)
    crowdsaleStore.setProperty('strategy', strategy)

    return {
      strategy: strategy
    }
  }

  goNextStep = () => {
    try {
      navigateTo({
        history: this.props.history,
        location: 'stepTwo',
        fromLocation: 'stepOne'
      })
    } catch (err) {
      logger.log('Error to navigate', err)
    }
  }

  handleChange = e => {
    const { crowdsaleStore } = this.props
    const strategy = e.currentTarget.value

    crowdsaleStore.setProperty('strategy', strategy)
    this.setState({
      strategy: crowdsaleStore.strategy
    })
    logger.log('CrowdsaleStore strategy selected:', strategy)
  }

  render() {
    const { contractStore } = this.props
    const status =
      (contractStore && contractStore.downloadStatus === DOWNLOAD_STATUS.SUCCESS) || localStorage.length > 0

    return (
      <div>
        <section className="lo-MenuBarAndContent">
          <StepNavigation activeStep={CROWDSALE_STRATEGY} />
          <div className="st-StepContent">
            <StepInfo
              description="Select a strategy for your crowdsale contract."
              stepNumber="1"
              title={CROWDSALE_STRATEGY}
            />
            <div className="sw-RadioItems">
              {strategies.map((strategy, i) => {
                return (
                  <StrategyItem
                    key={i}
                    strategy={this.state.strategy}
                    strategyType={strategy.type}
                    strategyDisplayTitle={strategy.display}
                    stragegyDisplayDescription={strategy.description}
                    handleChange={this.handleChange}
                  />
                )
              })}
            </div>
            <div className="st-StepContent_Buttons">
              <ButtonContinue disabled={!status} onClick={() => this.goNextStep()} />
            </div>
          </div>
        </section>
        <Loader show={this.state.loading} />
      </div>
    )
  }
}
