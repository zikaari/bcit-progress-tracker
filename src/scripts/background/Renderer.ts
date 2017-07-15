import { PROGRAMS, COURSES } from './Database'
import { Server } from './Server'
import { extend, round } from '../common/Utils'
import { Structs } from '../common/Structs'
/**
 * Renderer
 */
export class Renderer {

    public static getResponseHooks() {
        return {
            'renderReportForD2L': Renderer.renderReportForD2L
        }
    }

    private static renderReportForD2L() {
        return new Promise(async (resolve, reject) => {
            console.log('nicee');
            let userCourses = await Server.getUserCourses()
            let userPrograms: Structs.UPrograms = {}
            for (let courseId in userCourses) {
                // Merge user's course with indexed course to create course object
                let course = extend({}, COURSES[courseId], userCourses[courseId])
                if (course.programs) {
                    course.programs.forEach(programId => {
                        // Merge user's program with indexed program to create a program object
                        let program: Structs.UProgram =
                            // If exists already from previous runs (if any)
                            userPrograms[programId]
                            ||
                            // if not then create new entry
                            extend({}, PROGRAMS[programId], {
                                earnedCredits: 0,
                                floatingCredits: 0
                            })

                        if (Server.calcCourseProgress(course) === 100)
                            program.contributionByCompleteCourses += course.credits
                        else
                            program.finalContributionByCurrentCourses += course.credits

                        // create/replace program record
                        userPrograms[programId] = program
                    })
                }
            }
            resolve(Renderer.makeProgramRecordsRenderable(userPrograms))
        })
    }

    private static makeProgramRecordsRenderable(userProgramRecords: Structs.UPrograms): Structs.UPrograms & Structs.Renderable {
        let programRecordRenderables: Structs.UPrograms & Structs.Renderable = {}

        for (let programId in userProgramRecords) {
            let program = userProgramRecords[programId]
            let programProgress = {
                confirmed: (program.contributionByCompleteCourses / program.requiredCredits) * 100,
                floating: (program.finalContributionByCurrentCourses / program.requiredCredits) * 100
            }

            let progressPie = Renderer.renderProgressPieRing([
                { value: programProgress.confirmed, color: 'green' },
                { value: programProgress.floating, color: 'yellow' }
            ])

            programRecordRenderables[programId] = extend({}, program, {
                html: ` 
                    <tr>  
                        <td class="prog-trkr program-delivery-type-badge"> 
                            <span title="${undefined}" class="prog-trkr label-badge ${program.type}">${program.type}</span> 
                        </td>

                        <td class="prog-trkr program-credential-badge"> 
                            <span title="${undefined}" class="prog-trkr label-badge">${program.cred}</span> 
                        </td>

                        <td class="prog-trkr program-name"> 
                            <a title="${program.name}" href="http://bcit.ca/study/programs/${programId}">${program.name}</a> 
                        </td>

                        <td class="prog-trkr program-expandable-details">
                            <button data-pid="${programId}" title="Click for more details">
                                ${progressPie} 
                            </button>
                        </td> 
                    </tr>`
            })

        }

        return programRecordRenderables
    }

    private static renderProgressPieRing(data: { value: number, color: string }[], radius = 10, strokeSize = 10) {
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


}