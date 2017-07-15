import CourseDetails from './CourseDetails';
import ProgressPie from './ProgressPie'
import { sleep } from '../Utils'
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Structs } from '../../common/Structs'
import ProgramRecordList from './ProgramRecordList'
import { DOMReady } from '../../common/Utils'
import Controller from '../Controller'

interface IBcitCaStatsProps {
    programStats: Structs.UProgram
    courseId: string
    onClick: (course: Structs.Course) => void
}

interface IBcitCaStatsState { }

class CourseStats extends React.Component<IBcitCaStatsProps, IBcitCaStatsState> {
    public render() {
        let { programStats, courseId, onClick } = this.props

        let courseObj: Structs.Course = programStats.currentCourses[courseId] || programStats.completeCourses[courseId] || programStats.inCompleteCourses[courseId]

        let courseProgress = (programStats.inCompleteCourses[courseId]) ? 0 :
            (programStats.completeCourses[courseId]) ? 100 :
                Controller.calcCourseProgress(programStats.currentCourses[courseId])

        let pieData = [
            {
                value: courseProgress,
                color: '#00e325'
            }
        ]

        return (
            <button className={'prog-trkr course-stats'} onClick={_ => { onClick(courseObj) }}>
                <span className='course-credits'>{courseObj.credits.toPrecision(2)}</span>
                <span className='course-progress'>
                    <ProgressPie data={pieData} strokeSize={3} radius={15} />
                </span>
                <span className='course-linked-programs'>
                    <span className='bg'>⬡</span>
                    <span className='count'>{courseObj.programs.length}</span>
                </span>
            </button>
        );
    }
}

export async function render() {
    if (window.location.hash !== '#courses') {
        window.addEventListener('hashchange', render)
        return
    }
    window.removeEventListener('hashchange', render)
    const programId = window.location.pathname.match(/(?:\/study\/programs\/)(.+)/)[1]
    const programStats = await Controller.getUserProgramStats(programId) as Structs.UProgram
    console.log(programStats)
    if (programStats) {
        const [styles] = await Promise.all([fetch(chrome.runtime.getURL('/dist/styles/bcitca.css')).then(res => res.text()), DOMReady(window)])
        let courseListTd = Array.from(document.querySelectorAll('#programmatrix .course_number'))
        // debugger
        courseListTd.forEach((td: HTMLTableDataCellElement) => {
            let courseId = td.innerText.toLowerCase().replace(/\s+/, '')
            let courseObj: Structs.Course = programStats.currentCourses[courseId] || programStats.completeCourses[courseId] || programStats.inCompleteCourses[courseId]
            if (programStats.courses.indexOf(courseId) > -1) {
                let parentRow = td.parentElement as HTMLTableRowElement
                let creditsTd = parentRow.querySelector('.credits') as HTMLTableDataCellElement

                let handleOnClick = async (courseId) => {
                    let nextRow = parentRow.nextElementSibling as HTMLTableRowElement
                    if (nextRow.classList.contains('course-details')) {
                        nextRow.classList.toggle('active', !nextRow.classList.contains('active'))
                    }
                    else {
                        let parentTable = parentRow.parentElement as HTMLTableElement
                        let detailsRow = document.createElement('tr')
                        detailsRow.classList.add('prog-trkr', 'course-details', 'active')
                        let detailsCell = document.createElement('td')
                        detailsCell.colSpan = 4

                        detailsRow.appendChild(detailsCell)
                        parentTable.insertBefore(detailsRow, parentRow.nextElementSibling)

                        let programList = await Controller.getUserProgramStats(courseObj.programs, { sort_by: 'progress' }) as Structs.UPrograms
                        ReactDOM.render(
                            <div>
                                <span className='header-x'>{courseObj.cid.toUpperCase()} is also part of: </span>
                                <ProgramRecordList userProgramList={programList} />
                                <style>{styles}</style>
                            </div>
                            , detailsCell.appendChild(document.createElement('div')).attachShadow({ mode: 'closed' }) as any)
                    }
                }
                creditsTd.innerHTML = ''
                ReactDOM.render(
                    <div>
                        <CourseStats onClick={handleOnClick} programStats={programStats} courseId={courseId} />
                        <style>{styles}</style>
                    </div>
                    , creditsTd.appendChild(document.createElement('div')).attachShadow({ mode: 'closed' }) as any)

                if (programStats.completeCourses[courseId]) {
                    td.parentElement.classList.add('prog-trkr', 'course-done')
                }

                else if (programStats.currentCourses[courseId]) {
                    td.parentElement.classList.add('prog-trkr', 'course-in-progress')
                }
            }

        })
    }
}

let renderedDetailsAlready = []
function toggleCourseDetails(course: Structs.Course) {
    if (renderedDetailsAlready.indexOf(course.cid) > -1)
        return
    let courseListTd = Array.from(document.querySelectorAll('#programmatrix .course_number'))
    // debugger
    courseListTd.forEach((td: HTMLTableDataCellElement) => {
        let courseId = td.innerText.toLowerCase().replace(/\s+/, '')
        if (course.cid === courseId) {
            let parentRow = td.parentElement as HTMLTableRowElement




            renderedDetailsAlready.push(course.cid)
            return
        }
    })
}

export default render