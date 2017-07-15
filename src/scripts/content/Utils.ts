export function DOMReady(targetWindow: Window, state = 'complete') {
    return new Promise((resolve, reject) => {
        if (targetWindow.document.readyState === state) resolve()
        else {
            targetWindow.document.onreadystatechange = (e) => {
                if (targetWindow.document.readyState === state) resolve()
            }
        }
    })
}

export function sleep(millis) {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            resolve()
        }, millis);
    })
}

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

