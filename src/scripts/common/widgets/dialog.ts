
export function dialog(message: string, isCancelAble?: boolean): Promise<boolean> {
    return new Promise((resolve, reject) => {
        let newlines = message.split('\n')
        let msgHtml = ``
        newlines.forEach((line) => {
            if (line.indexOf('<p>') === -1)
                line = `<p>${line}</p>`
            msgHtml += line
        })

        let dialogBox = document.createElement('div')
        dialogBox.className = 'dialog-box-root'
        let dialogBoxBody = document.createElement('div')
        dialogBoxBody.className = 'dialog-box-body'
        let msgWrapper = document.createElement('div')

        let controlsWrapper = document.createElement('div')
        controlsWrapper.className = 'dialog-box-buttons'
        
        let okButton = document.createElement('button')
        okButton.classList.add('ok')
        okButton.innerText = 'OK'
        okButton.addEventListener('click', e => {
            closeDialog(dialogBox)
            resolve(true)
        })

        let cancelButton = document.createElement('button')
        cancelButton.innerText = 'Cancel'
        cancelButton.classList.add('cancel')
        cancelButton.addEventListener('click', e => {
            closeDialog(dialogBox)
            resolve(false)
        })
        controlsWrapper.appendChild(okButton)
        if (isCancelAble) {
            controlsWrapper.appendChild(cancelButton)
        }

        msgWrapper.innerHTML = msgHtml



        dialogBoxBody.appendChild(msgWrapper)
        dialogBoxBody.appendChild(controlsWrapper)
        dialogBox.appendChild(dialogBoxBody)

        document.body.appendChild(dialogBox)
        setTimeout(function () {
            dialogBox.classList.add('visible')
        }, 100);

    })
}

function closeDialog(dialogBox) {
    dialogBox.classList.remove('visible')
    setTimeout(() => {
        document.body.removeChild(dialogBox)
    }, 1000)
}