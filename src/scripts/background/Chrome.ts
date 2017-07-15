import {extend} from '../common/Utils'

/**
 * Chrome
 */
class Chrome {

    private static registeredMsgResponders = {}
    /**
     * init
     */
    public static init() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.processMessage(message)
                .then(res => {
                    sendResponse(res)
                })
            return true
        })
    }

    private static processMessage(message) {
        return new Promise(async (resolve, reject) => {
            if (typeof message === 'string') {
                let responder = this.registeredMsgResponders[message]
                if (responder)
                    resolve(await responder())
            }
            else if (typeof message === 'object') {
                let messageDescriptor = Object.keys(message)[0]
                let messageData = message[messageDescriptor]
                let responder = this.registeredMsgResponders[messageDescriptor]
                if (responder)
                    resolve(await responder(messageData))
            }
        })
    }
    /**
     * registerListener
     */
    public static registerResponder(responderHooks) {
        extend(this.registeredMsgResponders, responderHooks)
    }
}

export default Chrome