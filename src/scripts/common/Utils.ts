export const extend = Object.assign

const isArrFn = Array.isArray
export const isArray = o => isArrFn(o) as boolean
// export function isArray(o) {

// }

export function round(value, exp) {
    if (typeof exp === 'undefined' || +exp === 0)
        return Math.round(value);

    value = +value;
    exp = +exp;

    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
        return NaN;

    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}

export function sortObject(jsonObject: { [key: string]: any }, comparator: (o1, o2) => number) {
    let keys = Object.keys(jsonObject)
    let elements = []
    keys.map(key => {
        elements.push(jsonObject[key])
    })
    let sortStack = []
    // sort elements and save the sortStack to later apply to keys
    elements.sort((o1, o2) => {
        let sortOrder = comparator(o1, o2)
        sortStack.push(sortOrder)
        return sortOrder
    })
    // sort the keys in same order, stored in sortStack
    keys.sort((a, b) => {
        return sortStack.shift()
    })

    let oSorted = {}
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i]
        oSorted[key] = elements[i]
    }
    return oSorted
}

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

export function until(conditionalCallback: () => boolean, interval: number) {
    return new Promise((resolve, reject) => {
        const _interval = setInterval(_ => {
            const ret = conditionalCallback()
            console.log('trying', ret)
            if (ret === false) {
                clearInterval(_interval)
                resolve()
            }
        }, interval)
    })
}

export function sleep(millis) {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            resolve()
        }, millis);
    })
}

