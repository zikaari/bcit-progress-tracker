import Controller from '../content/Controller';
let isConfigured = false
let Rollbar = null
export default async function getLogger() {
    const uid = await Controller.getUserIdentifier()
    if (!isConfigured) {
        var rollbarConfig = {
            accessToken: '6ead2d715a04410ba247891760eaf666',
            captureUncaught: true,
            payload: {
                environment: 'development',
                person: {
                    id: uid
                },
            }
        };
        Rollbar = new rollbar(rollbarConfig);
        isConfigured = true
    }
    return {
        error(e) {
            Rollbar.error(e)
        },
        info(e) {
            Rollbar.info(`${new Date().toISOString()} ${e}`)
        },
        warn() {

        }
    }
}