import ProgressPie from './ProgressPie'
import { sleep } from '../../common/Utils'
import * as React from 'react';
import { Structs } from '../../common/Structs'
import ProgramDetails from './ProgramDetails'
import classNames from 'classnames'

interface IProgramRecordListProps {
    userProgramList: Structs.UPrograms
};

interface IProgramRecordListState {
    isDetailedViewOpen: boolean;
    detailFocusedProgram: Structs.UProgram;
    liNodeOffset: number
};

class ProgramRecordList extends React.Component<IProgramRecordListProps, IProgramRecordListState> {
    private listContainer: HTMLOListElement
    constructor(props) {
        super()
        this.state = {
            isDetailedViewOpen: false,
            detailFocusedProgram: null,
            liNodeOffset: null
        }
    }

    handleButtonClick = async (program: Structs.UProgram, e: React.MouseEvent<HTMLButtonElement>) => {
        console.log('nice')
        let liNode = e.currentTarget.parentElement.parentElement as HTMLLIElement
        if (this.state.isDetailedViewOpen) {
            await sleep(100)
            this.setState({ isDetailedViewOpen: false, detailFocusedProgram: null, liNodeOffset: null })
        } else {
            let offset = liNode.getBoundingClientRect().top - this.listContainer.getBoundingClientRect().top
            this.setState({ isDetailedViewOpen: true, detailFocusedProgram: program, liNodeOffset: offset })
        }
    }

    private renderProgressPie(program: Structs.UProgram): JSX.Element {
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
        ]
        return <ProgressPie data={pieData} strokeSize={4} radius={11} />
    }
// ref={r => r.addEventListener('click', e => this.handleButtonClick(program, e))}
    public render() {
        let { userProgramList } = this.props
        const { isDetailedViewOpen, detailFocusedProgram, liNodeOffset } = this.state
        let programRecords = []
        for (let programId in userProgramList) {
            let program = userProgramList[programId]
            let isThisVerbose = (isDetailedViewOpen && program === detailFocusedProgram)
            programRecords.push(
                <li className={classNames("prog-trkr program-record", isThisVerbose ? 'detail-view-active' : '')} key={`${program.name}${program.cred}`} style={isThisVerbose ? { transform: `translateY(-${liNodeOffset}px)` } : {}}>
                    <div className={'header'}>
                        <span className="prog-trkr program-delivery-type"><span className={classNames('prog-trkr', 'badge', program.type)}>{program.type}</span></span>
                        <span className="prog-trkr program-credential"><span className={classNames('prog-trkr', 'badge', program.cred)}>{program.cred}</span></span>
                        <span className='prog-trkr program-name'><a href={`http://bcit.ca/study/programs/${program.pid}`}>{program.name}</a></span>
                        <button onClick={e => this.handleButtonClick(program, e)} className={classNames('prog-trkr program-progress-pie program-detail-btn')}>
                            {!isThisVerbose ? this.renderProgressPie(program) : <i className='close-btn-icon'></i>}
                        </button>
                    </div>
                    {
                        isThisVerbose ?
                            <ProgramDetails program={program} />
                            :
                            null
                    }
                </li>
            )
        }

        return (
            <ol ref={r => this.listContainer = r} className={classNames('prog-trkr', 'program-record-list', (this.state.isDetailedViewOpen) ? 'detail-view-active' : '')}>
                {programRecords}
            </ol>
        );
    }
}



export default ProgramRecordList;
