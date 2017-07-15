import getLogger from '../common/Rollbar';
import { DOMReady, sleep } from './Utils';
import { Constants } from '../common/Constants'
import { Structs } from '../common/Structs'
import Controller from './Controller'
class Scrapper {
    private static Rollbar = null
    public static async scrapeIfNeeded() {
        this.Rollbar = this.Rollbar || await getLogger()
        let isScraperBusy = false
        window.addEventListener('beforeunload', (e) => {
            if (isScraperBusy) {
                return 'Please wait'
            }
        })

        let queuedJobs = await Controller.getQueuedJobs()
        if (window.location.origin === 'https://www.bcit.ca' && queuedJobs['bcit.ca']) {
            this.Rollbar.info('Scraping bcit.ca')
            isScraperBusy = true
            let isSlave = false
            window.addEventListener('message', async (e) => {
                if (e.data === 'scrape_init') {
                    isSlave = true
                    try {
                        e.source.postMessage('scrape_order_accepted', '*')
                        let courseDurations = await Scrapper.scrapeBcitCa()
                        await Controller.handleBcitCaScrape(courseDurations)
                        await Controller.unQueueJob('bcit.ca')
                        e.source.postMessage('scrape_finished', '*')
                        isScraperBusy = false
                    }
                    catch (err) {
                        throw err
                    }
                    return true
                }
            })
            await sleep(1000)
            if (!isSlave) {
                await DOMReady(window)
                await Scrapper.triggerBcitCaScrape()
                isScraperBusy = false
                return true
            }
        }

        if (window.location.href === 'https://learn.bcit.ca/d2l/home' && queuedJobs['d2l']) {
            this.Rollbar.info('Scraping D2L')
            isScraperBusy = true
            console.log('waiting')
            await DOMReady(window)
            console.log('initializing')
            try {
                let crns = await Scrapper.scrapeD2lForCrns()
                await Controller.handleD2lScrape(crns)
                await Controller.unQueueJob('d2l')
                await Controller.queueScrapeJob('bcit.ca')
                isScraperBusy = false
                await Scrapper.triggerBcitCaScrape()
            } catch (err) {
                this.Rollbar.info('An error occured while scraping d2l')
                this.Rollbar.error(err)
            }
            this.Rollbar.info('d2l scraped')

            return true
        }

        if (window.location.origin === 'https://my.bcit.ca' && window.location.href !== 'https://my.bcit.ca/cp/home/displaylogin') {

            await DOMReady(window)
            // if (await this.shouldAppAutoScrape() === false)
            await this.getUserAuthorization()
            isScraperBusy = true
            this.Rollbar.info('Scraping my.bcit.ca')
            try {
                let courseList = await this.scrapeMyBcitForCourses()
                let res = await Controller.handleMyBcitScrape(courseList)
                await Controller.queueScrapeJob('d2l')

                let msg = { title: ``, body: `` }
                if (res.status === 'success') {
                    msg.title = `Great!`
                    msg.body = `Progress Tracker courses have been updated :)\nNow please log in to D2L to enable live-sync.`
                    swal({
                        title: msg.title,
                        text: msg.body,
                        type: "success",
                        showCancelButton: false,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Take me to D2L",
                        closeOnConfirm: true,
                        allowEscapeKey: false
                    },
                        (isConfirm) => {
                            window.open('https://learn.bcit.ca/d2l/home', '_blank')
                        }
                    )
                }
                else {
                    swal('Oops', `something went wrong`)
                }
            }
            catch (err) {
                this.Rollbar.error(err)
            }
            this.Rollbar.info('Scraped my.bcit.ca')
            isScraperBusy = false
            return true
        }
        else {
            return true
        }
    }

    private static scrapeBcitCa() {
        return new Promise(async (resolve, reject) => {
            await DOMReady(window)
            console.log('scraping')
            document.body.innerHTML = ''
            let css = `
                    body {
                        overflow: hidden !important;
                    }
                    .prog-trkr.wait-modal {
                        height: 100vh;
                        width: 100vw;
                        background: white;
                        overflow: hidden;
                    }

                    .prog-trkr.progress-bar-container {
                        height: 7px;
                        width: 400px;
                        margin: auto;
                        border-radius: 50em;
                        overflow: hidden;
                        background: #ebebeb;
                    }

                    .prog-trkr.modal-content {
                        position: absolute;
                        top: 40%;
                        left: 0;
                        right: 0;
                    }

                    .prog-trkr h1 {
                        font-size: 20px;
                        margin: 60px 0;
                        color: #494949;
                    }

                    .prog-trkr h2 {
                        font-size: 15px;
                        margin: 0;
                        margin-bottom: 20px;
                        color: #494949;
                    }
                    
                    .prog-trkr p {
                        font-size: 14px;
                        color: #414141;
                    }

                    .prog-trkr .progress-bar-progress {
                        width: 12%;
                        height: 100%;
                        background: linear-gradient(90deg, #00ff9e, #00ffa9);
                        border-radius: 50em;
                    }
                `
            let html = `
                    <div class="prog-trkr wait-modal">
                        <div class="prog-trkr modal-content">
                            <h1>One last step towards awesomeness</h1>
                            <h2>Progress Tracker is fetching duration of your courses</h2>
                            <div class="prog-trkr progress-bar-container">
                                <div class="prog-trkr progress-bar-progress"></div>
                            </div>
                            <p>Please do not close this tab, it'll close auto-magically when finished!</p>
                        </div>
                    </div>
                `
            let div = document.createElement('div')
            div.innerHTML = html
            document.body.appendChild(div)
            let style = document.createElement('style')
            style.appendChild(document.createTextNode(css))
            document.head.appendChild(style)

            let userCourses = await Controller.getUserCourseList()
            let coursesWithMissingDurations: Structs.UCourses = {}
            for (let courseId in userCourses) {
                let course = userCourses[courseId]
                if (course.startDate !== 'NOT_RELEVANT_ANYMORE') {
                    coursesWithMissingDurations[courseId] = course
                }
            }
            let numOfCoursesToScrape = Object.keys(coursesWithMissingDurations).length
            let numOfCoursesScraped = 0
            let progress = 0
            let courseDurations = {}
            await sleep(1000)
            for (let courseId in coursesWithMissingDurations) {
                let course = coursesWithMissingDurations[courseId]
                let iframe = document.createElement('iframe')
                iframe.onload = (e) => {
                    let idocument = iframe.contentDocument
                    let crnNodes: HTMLElement[] = Array.prototype.slice.call(idocument.querySelectorAll('.sctn h1 span'))
                    crnNodes.forEach((crnNode) => {
                        let crn = crnNode.innerText
                        if (course.crn === crn) {
                            let durationNode = crnNode.parentElement.nextElementSibling.querySelector('p')
                            let duration = durationNode.innerHTML.replace(/\<[\S\s]+/ig, '')
                            let startDate = new Date(`${duration.split('-')[0]} ${course.year}`)
                            let endDate = new Date(`${duration.split('-')[1]} ${course.year}`)
                            // I'm making no assumptions about nothing
                            if ((endDate.getTime() - startDate.getTime()) < 0) {
                                endDate = new Date(`${duration.split('-')[1]} ${course.year + 1}`)
                            }
                            courseDurations[courseId] = {
                                startDate: startDate.toISOString(),
                                endDate: endDate.toISOString()
                            }
                        }
                    })
                    numOfCoursesScraped++;
                    let progressBar: HTMLDivElement = div.querySelector('.progress-bar-progress') as HTMLDivElement
                    progress = (numOfCoursesScraped / numOfCoursesToScrape) * 100
                    progressBar.style.width = `${progress}%`
                    if (progress === 100) {
                        let statusLabel = div.querySelector('.prog-trkr h1') as HTMLHeadingElement
                        let statusLabel2 = div.querySelector('.prog-trkr h2') as HTMLParagraphElement
                        statusLabel.innerText = 'Done.'
                        statusLabel2.innerText = 'Progress Tracker is DONE fetching duration of your courses. Enjoy!'
                        for (let cid in courseDurations) {
                            if (!courseDurations[cid].startDate) {
                                courseDurations[cid] = {
                                    startDate: 'NOT_RELEVANT_ANYMORE',
                                    endDate: 'NOT_RELEVANT_ANYMORE'
                                }
                            }
                        }
                        resolve(courseDurations)
                    }
                    document.body.removeChild(iframe)
                }
                iframe.src = `https://www.bcit.ca/study/courses/${courseId.toLowerCase()}`
                document.body.appendChild(iframe)
            }
        })
    }

    private static getUserAuthorization() {
        return new Promise(async (resolve, reject) => {
            if (document.querySelector('#MIC3smdf23fdeegfcxs')) {
                reject('Cannot create another permission handle')
            }
            var updateBtn = document.createElement('button')
            updateBtn.setAttribute('id', 'MIC3smdf23fdeegfcxs')
            updateBtn.innerText = 'Update Progress Tracker Database'
            updateBtn.setAttribute(
                'style', `
                        margin-right: 10px;
                        font-size: 0.8em;
                        border-radius: 8px;
                        border: none;
                        padding: 2px 6px;
                        cursor: pointer;
                        background: linear-gradient(#006ac6, #52aeff);
                        color: #FFF;
                `)
            let targetBefore = document.querySelector('#date_txt')
            targetBefore.parentElement.insertBefore(updateBtn, targetBefore)

            updateBtn.addEventListener('click', () => {
                updateBtn.disabled = true
                updateBtn.style.opacity = '.2'
                updateBtn.style.cursor = 'default'
                resolve(true)
            })
        })
    }

    private static scrapeMyBcitForCourses(): Promise<Structs.UCourses> {
        return new Promise((resolve, reject) => {
            var courses = {}
            var activeYear, activeSemester: SemesterStr

            this.normalizeMyBcitEnv(async (courseListTable) => {
                let dataNodes = Array.prototype.slice.call(courseListTable.querySelectorAll('span'))
                dataNodes.forEach((node: HTMLElement) => {
                    if (node.id === 'tableterm_txt') {
                        activeYear = parseInt(node.innerText.match(/\d{4}/g).join())
                        activeSemester = node.innerText.match(/([^\/?][a-z]+)/ig)[0] as SemesterStr
                    }

                    else if (node.id === 'sclasssection_txt') {
                        let courseId = node.innerText.replace('-', '').substr(0, 8).toLowerCase()
                        courses[courseId] = {
                            semester: <Constants.Semester>Constants.Semester[activeSemester],
                            year: activeYear
                        }
                    }
                })
                resolve(courses)
            })
        })
    }

    private static triggerBcitCaScrape() {
        return new Promise(resolve => {
            let win = window.open('http://bcit.ca', '_blank')
            let poll = setInterval((_) => {
                win.postMessage('scrape_init', '*')
            }, 10)
            window.addEventListener('message', e => {
                if (e.data === 'scrape_order_accepted') {
                    clearInterval(poll)
                }
                if (e.data === 'scrape_finished') {
                    setTimeout(() => {
                        win.close()
                        resolve()
                    }, 1000)
                    swal(`Awesome!`, `Progress Tracker is now all set up.`)
                    console.log('resolved at: ', Date.now())
                }
            })
        })
    }

    private static async normalizeMyBcitEnv(cb) {

        var scheduleFrame = document.createElement('iframe'), isFirstLoad = true
        scheduleFrame.onload = async (e) => {
            if (!isFirstLoad) return
            isFirstLoad = false
            var scheduleWindow = scheduleFrame.contentWindow
            var s_document = scheduleWindow.document
            await DOMReady(scheduleWindow)
            let termSelector = s_document.querySelector('select[name=currentTerm]') as HTMLSelectElement
            let termSelectorOpts = termSelector.querySelectorAll('option')
            let allTermsOpt = termSelectorOpts[0]
            let done = false
            if (termSelector.value !== allTermsOpt.value) {
                let userDefault = termSelector.value
                scheduleFrame.addEventListener('load', (e) => {
                    if (done) return
                    let copy = scheduleFrame.contentDocument.querySelector('#sCourseList').cloneNode(true)
                    done = true
                    let termSelector = scheduleFrame.contentDocument.querySelector('select[name=currentTerm]') as HTMLSelectElement
                    termSelector.value = userDefault
                    termSelector.dispatchEvent(new Event('change'))
                    cb(copy)
                })
                termSelector.value = allTermsOpt.value
                termSelector.dispatchEvent(new Event('change'))
            }
            else {
                cb(scheduleFrame.contentDocument.querySelector('#sCourseList').cloneNode(true))
            }
        }
        scheduleFrame.src = 'https://my.bcit.ca/cp/school/schedule'
        scheduleFrame.style.display = 'none'
        document.body.appendChild(scheduleFrame)
    }

    private static scrapeD2lForCrns(): Promise<{ [cid: string]: { crn: string } }> {
        return new Promise(resolve => {
            let courseCrns: { [cid: string]: { crn: string } } = {}
            let semesterFilterSelectEl = document.getElementById('filtersData$semesterId') as HTMLSelectElement
            let semesterFilterOptions = semesterFilterSelectEl.querySelectorAll('option')
            let allTermsOption = semesterFilterOptions[0]
            let userDefaultSemester = semesterFilterSelectEl.value
            let semesterFilterRootFormEl = semesterFilterSelectEl.parentElement
            while (semesterFilterRootFormEl.tagName !== 'FORM') {
                semesterFilterRootFormEl = semesterFilterRootFormEl.parentElement
            }
            let courseListContainer = semesterFilterRootFormEl.nextElementSibling
            // Since we need list of ALL the courses, we need to check if user has set their view to anything else than 'ALL'
            // We don't have any hook on XHR object that D2L uses to load courses
            let observer = new MutationObserver(tryScrape)
            observer.observe(courseListContainer, { childList: true, subtree: true })

            // Have the courses load for all semesters by bruteforcing that, we'll reset that once we're done
            semesterFilterSelectEl.value = allTermsOption.value
            semesterFilterSelectEl.dispatchEvent(new Event('change'))
            tryScrape()

            function tryScrape() {
                debugger
                let termContainers = Array.from(courseListContainer.querySelectorAll('.d2l-collapsepane')) as HTMLElement[]
                if (termContainers.length === semesterFilterOptions.length - 1) {
                    // Copy the container
                    // let copy = courseListContainer.cloneNode(true) as HTMLElement
                    // After copy is done we need to clean up the mess we created
                    observer.disconnect()
                    // Reset back to whatever user had setup
                    semesterFilterSelectEl.value = userDefaultSemester
                    semesterFilterSelectEl.dispatchEvent(new Event('change'))

                    let terms = []
                    termContainers.forEach(term => {
                        let header = term.querySelector('.d2l-collapsepane-header') as HTMLElement
                        terms.push({
                            time: parseInt(<any>header.innerText.match(/\d{6}/)) || 0,
                            courses: Array.from(term.querySelectorAll('div.d2l-datalist-item-content')).map((courseLabel: HTMLElement) => courseLabel.innerText)
                        })
                    })

                    // Sort the terms, most recent last
                    terms.sort((t1, t2) => {
                        if (t1.time > t2.time) {
                            return 1
                        }
                        else if (t1.time < t2.time) {
                            return -1
                        }
                        return 0
                    })

                    // This must be done at last, user should not have to wait because our script takes long, so we made a copy
                    let courses: string[] = []

                    terms.forEach(term => {
                        courses.push(...term.courses)
                    })

                    /**
                     * VERY VERY IMPORTANT
                     * This loop must be run in reverse, because first in this list is most recent, that means if run in forward direction
                     * the course info in most recent term will get over-written by the course info in older terms, we want the opposite effect
                     */
                    courses.forEach(courseLabel => {
                        let courseId = courseLabel.replace(/[-\s+]/ig, '').substr(0, 8).toLowerCase()
                        courseCrns[courseId] = {
                            crn: courseLabel.match(/\d{5}/ig).join('')
                        }
                    })
                    console.log(courseCrns)
                    resolve(courseCrns)
                }
            }
        })
    }

    private static shouldAppAutoScrape(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage('shouldAppAutoScrape', res => {
                resolve(res)
            })
        })
    }
}

interface Term {
    year: number;
    semester: Constants.Semester
}

type SemesterStr = 'Winter' | 'Spring' | 'Fall'




export default Scrapper