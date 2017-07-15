import * as React from "react";
import { Structs } from '../../common/Structs'
import classNames from 'classnames'
import ProgressPie from './ProgressPie'
import CourseDetailEntry from './CourseDetailEntry'

interface IProgramDetailsProps {
    program: Structs.UProgram
}

interface IProgramDetailsState {
    focusedTab: CourseType
}

type CourseType = 'done' | 'in-progress' | 'incomplete'

class ProgramDetails extends React.Component<IProgramDetailsProps, IProgramDetailsState> {
    constructor(props) {
        super()
        this.state = {
            focusedTab: 'in-progress'
        }
    }
    setFocusedTab = (tab: CourseType) => {
        this.setState({ focusedTab: tab })
    }
    public render() {
        let { program } = this.props
        let requiredCreditsAsPct = (program.requiredCredits / program.totalCredits) * 100

        let pieData = [
            {
                value: program.contributionByCompleteCourses,
                color: '#05e105'
            },
            {
                value: program.presentContributionByCurrentCourses,
                color: '#0065ff'
            },
            {
                value: program.finalContributionByCurrentCourses - program.presentContributionByCurrentCourses,
                color: '#ff7246'
            },
            {
                value: requiredCreditsAsPct - (program.finalContributionByCurrentCourses + program.contributionByCompleteCourses),
                color: '#b6b6b6'
            },
            {
                isMarker: true,
                color: '#b6b6b6'
            }
            // {
            //     value: 100 - requiredCreditsAsPct,
            //     color: 'pink'
            // }
        ]

        function getCoursesEntries(status: string): Structs.Course[] {
            let entries = []
            if (!program[status]) {
                throw new TypeError(`${status} is not a valid status`)
            }
            for (let courseId in program[status]) {
                let course = program[status][courseId]
                entries.push(<CourseDetailEntry course={course} key={courseId} />)
            }
            return entries
        }

        let courseList: { type: CourseType, entries: Structs.Course[] }[] = [
            { type: 'done', entries: getCoursesEntries('completeCourses') },
            { type: 'in-progress', entries: getCoursesEntries('currentCourses') },
            { type: 'incomplete', entries: getCoursesEntries('inCompleteCourses') },
        ]

        return (
            <div className={classNames('prog-trkr', 'program-details')}>
                <div className={classNames('prog-trkr', 'program-detailed-pie')}>
                    <ProgressPie data={pieData} radius={50} strokeSize={13} />
                </div>
                <div className={classNames('prog-trkr', 'program-detail-table')}>
                    <div className={classNames('prog-trkr', 'program-detail-tabs')}>
                        <ul>
                            {
                                courseList.map(courses => {
                                    return (
                                        <li key={courses.type}>
                                            <button onClick={this.setFocusedTab.bind(this, courses.type)} className={classNames((this.state.focusedTab === courses.type) ? 'active' : null)}>{courses.type.replace('-', ' ')}</button>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </div>
                    <div className='prog-trkr program-detail-tables'>
                        {
                            courseList.map(courses => {
                                return (
                                    <table key={courses.type} className={classNames('prog-trkr table course-table', (this.state.focusedTab === courses.type) ? 'active' : null)}>
                                        <tbody>
                                            {courses.entries}
                                        </tbody>
                                    </table>
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        )
    }
}

export default ProgramDetails;
