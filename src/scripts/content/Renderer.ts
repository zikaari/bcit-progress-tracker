import getLogger from '../common/Rollbar';
import renderD2L from './components/D2L'
import renderBcitCa from './components/BcitCa'

class Renderer {

    public static async render() {
        const Rollbar = await getLogger()
        let loc = window.location.href
        Rollbar.info('Renderer detecting context')
        if (loc === 'https://learn.bcit.ca/d2l/home') {
            Rollbar.info('Renderer context d2L')
            renderD2L()
            return
        }
        if (/https?:\/\/(www\.)?bcit\.ca\/study\/programs\/.+/.test(loc)) {
            Rollbar.info('Renderer context bcit.ca')
            renderBcitCa()
            return
        }
        Rollbar.info(`Renderer context not found at ${window.location.href}`)
    }
}

export default Renderer;