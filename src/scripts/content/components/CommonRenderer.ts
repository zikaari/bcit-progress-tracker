import { round } from '../../common/Utils'
import { Structs } from '../../common/Structs'
/**
 * CommonRenderer
 */
class CommonRenderer {
}

export function getUserProgramList(): Promise<Structs.UPrograms> {

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                'getUserProgramList': {
                    'sort_by': 'progress'
                }
            }, (userProgramList) => {
                resolve(userProgramList)
            })
    })
}


export function renderProgressPieRing(data: { value: number, color: string }[], radius = 10, strokeSize = 10) {
    var svgBox = (radius * 2) + (radius * 2 * .12);
    var circlePos = radius + (radius * .10);
    var c = 2 * Math.PI * radius
    var ringsHtml = "";

    for (var i = 0, len = data.length, prevValOffset = 0, ringHtml = ""; i < len; i++) {
        var nowVal = data[i].value + prevValOffset;
        var progress = 565.5 - ((round(nowVal, 2) * c) / 100);

        ringHtml = `
                <circle 
                    class="progress-ring" 
                    r = "${radius}" 
                    cx = "${circlePos}" 
                    cy = "${circlePos}" 
                    fill = "transparent" 
                    stroke-dasharray = "565.48" 
                    stroke = "#dadada" 
                    stroke-dashoffset = "${(progress - 0.60)}" 
                    stroke-width = "${strokeSize}%">
                </circle>

                <circle 
                    class="progress-ring" 
                    r="${radius}" 
                    cx="${circlePos}" 
                    cy="${circlePos}" 
                    fill="transparent" 
                    stroke-dasharray="565.48" 
                    stroke="${data[i].color}" 
                    stroke-dashoffset="${(progress - 0.10)}" 
                    stroke-width="${strokeSize}%">
                </circle>`

        // This is weird, but to preserve the order in which rings will be rendered, every new ring is bigger than previous so it is moved below the previous one.
        ringsHtml = ringHtml + ringsHtml;

        prevValOffset += data[i].value;
    }

    return `
            <svg width="${svgBox}" height="${svgBox}">
                <circle 
                    class="progress-ring-bg" 
                    r="${radius}" 
                    cx="${circlePos}" 
                    cy="${circlePos}" 
                    fill="transparent" 
                    stroke-dasharray="565.48" 
                    stroke-dashoffset="0" 
                    stroke-width="${strokeSize}%">
                </circle>

                <g class="ring-cluster paused">
                    ${ringsHtml}
                </g>
            </svg>`
}
export default CommonRenderer