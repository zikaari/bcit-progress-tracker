import Controller from './Controller';
import { DOMReady, until } from '../common/Utils';
import getLogger from '../common/Rollbar';
import Scrapper from './Scrapper'
import Renderer from './Renderer'

async function Main() {
    await DOMReady(window)
    let Rollbar = await getLogger()
    let storeState = {
        jobs: await Controller.getQueuedJobs(),
        courses: Object.keys(await Controller.getUserCourseList())
    }
    Rollbar.info(`Store state before scrape: ${JSON.stringify(storeState)}`)
    Rollbar.info('Scrape started')
    try {
        await Scrapper.scrapeIfNeeded()
    } catch (e) {
        Rollbar.error(e)
    }
    Rollbar.info('Scrape finished')
    let storeStateAfter = {
        jobs: await Controller.getQueuedJobs(),
        courses: Object.keys(await Controller.getUserCourseList())
    }
    Rollbar.info(`Store state after scrape: ${JSON.stringify(storeStateAfter)}`)
    Rollbar.info('Rendering view')
    Renderer.render()
}

Main()