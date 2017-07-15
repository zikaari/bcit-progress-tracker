import { sleep } from '../Utils';
import * as React from "react";
import * as ReactDOM from 'react-dom'

import { Structs } from '../../common/Structs'
import ProgramRecordList from './ProgramRecordList'
import { DOMReady } from '../../common/Utils'
import Controller from '../Controller'

interface ID2LStatsProps {
    userProgramList: Structs.UPrograms
};

interface ID2LStatsState { };

class D2LStats extends React.Component<ID2LStatsProps, ID2LStatsState> {
    public render() {
        let { userProgramList } = this.props
        return (
            <div>
                <ProgramRecordList userProgramList={userProgramList} />
            </div>
        );
    }
}

export async function render() {

    let userProgramList = await Controller.getUserProgramList({ sort_by: 'progress' })
    console.log('nice indeed', userProgramList);
    await DOMReady(window)
    let myCoursesContainer = document.querySelector('.d2l-box-layout > .d2l-box:nth-child(2) > .d2l-widget')
    if (!myCoursesContainer) {
        return
    }

    let sandboxDiv = document.createElement('div')
    myCoursesContainer.insertAdjacentElement('afterend', sandboxDiv)
    let content = sandboxDiv.attachShadow({ mode: 'closed' })

    if (!userProgramList) {
        content.innerHTML = `<p>To activate Progress Tracker please login into my.bcit.ca and click 'Update Progress Tracker' button in top right corner</p>`
    }
    const fetchRes = await fetch(chrome.runtime.getURL('/dist/styles/d2l.css'))
    const styles = await fetchRes.text()
    ReactDOM.render(
        <div className='prog-trkr d2l-shadow-root'>
            <div className={'prog-trkr d2l-like-header'}>
                <span>My Progress</span>
                <button>></button>
            </div>
            <D2LStats userProgramList={userProgramList} />
            <style>{styles}</style>
        </div>
        , content as any)
}

export default render