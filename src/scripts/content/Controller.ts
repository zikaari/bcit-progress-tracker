import { uuid } from './Utils';
import { COURSES, PROGRAMS } from '../background/Database';
import { Structs } from '../common/Structs'
import { Constants } from '../common/Constants'
import { extend, sortObject, isArray } from '../common/Utils'

class Controller {

    public static async getUserIdentifier() {
        let uid = await getItem('userId')
        if (!uid) {
            uid = uuid()
            await setItem('userId', uid)
        }
        return uid
    }

    public static async getUserCourseList(): Promise<Structs.UCoursesPlus> {
        let userCourseList = await getItem('courses') as Structs.UCourses
        if (!userCourseList) return {}
        for (let cid in userCourseList) {
            Object.assign(userCourseList[cid], COURSES[cid])
        }
        return userCourseList as Structs.UCoursesPlus
    }

    public static handleMyBcitScrape(scrapedCourses): Promise<{ status: 'success' | 'fail' }> {
        return new Promise(async (resolve, reject) => {
            //let didListChange = await this.compareAndSaveMyBcitScrape(scrape)
            let courses: Structs.UCourses = {}
            for (let courseId in scrapedCourses) {
                courses[courseId] = {
                    cid: courseId,
                    crn: null,
                    startDate: null,
                    endDate: null,
                    semester: scrapedCourses[courseId].semester,
                    year: scrapedCourses[courseId].year
                }
            }
            await Controller.saveUserCourses(courses)
            let res = { status: 'success' }
            resolve(res)
        })
    }

    public static async handleD2lScrape(scrapedCrns) {
        console.log('handling scrapt')
        // VERY Critical that this is done first, to avoid dealing with useless data
        await Controller.normalizeCoursesDates()
        return Controller.mergeNewCourseInfo(scrapedCrns)
    }

    public static async handleBcitCaScrape(scrapedDurations) {
        return await Controller.mergeNewCourseInfo(scrapedDurations)
    }

    /**
     * Assigns very old dates for endDate and startDate for courses which are now a thing of past (at least for internals of progress tracker)
     */
    private static async normalizeCoursesDates() {
        let userCourses = await Controller.getUserCourseList()
        debugger
        let updatedCoures = extend(userCourses)
        let today = new Date()
        let currentSemester = Controller.getActiveSemester()
        for (let courseId in userCourses) {
            let course = userCourses[courseId]
            if (
                today.getFullYear() > course.year // Now the course is a thing of past
                ||
                (today.getFullYear() === course.year && currentSemester > course.semester) // For courses which are in present year, but past semesters
            ) {
                updatedCoures[courseId] = {
                    cid: courseId,
                    crn: course.crn,
                    year: course.year,
                    semester: course.semester,
                    startDate: 'NOT_RELEVANT_ANYMORE', // Arbitrary dates just to tell they are not relevant as of now
                    endDate: 'NOT_RELEVANT_ANYMORE',
                }
            }
        }
        await Controller.saveUserCourses(updatedCoures)
    }


    /**
     * Allows safe merging of new data
     */
    private static async mergeNewCourseInfo(scrapedData) {
        let userCourses = await Controller.getUserCourseList()
        for (let courseId in scrapedData) {
            let existingCourse = userCourses[courseId]
            if (existingCourse) {
                userCourses[courseId] = Object.assign({}, existingCourse, scrapedData[courseId])
            }
        }
        await Controller.saveUserCourses(userCourses)
        return { status: 'success' }
    }

    /**
     * Saves/Overwrites user course list. WARNING: Performs a hard overwrite
     */
    public static saveUserCourses(updatedCourses: Structs.UCourses): Promise<boolean> {
        return setItem('courses', updatedCourses)
    }

    public static async  getQueuedJobs() {
        return await getItem('queuedJobs') || {}
    }

    public static async queueScrapeJob(target: 'd2l' | 'bcit.ca') {
        let jobs = await Controller.getQueuedJobs()
        jobs[target] = true
        return setItem('queuedJobs', jobs)
    }

    public static async unQueueJob(target: 'd2l' | 'bcit.ca') {
        let jobs = await Controller.getQueuedJobs()
        jobs[target] = false
        return setItem('queuedJobs', jobs)
    }

    public static async getUserProgramStats(programId: string | string[], options: { sort_by?: 'progress' } = {}): Promise<Structs.UPrograms | Structs.UProgram> {
        let programIds = []
        if (Array.isArray(programId)) {
            programIds = programId
        }
        else if (typeof programId === 'string') {
            programIds = [programId]
        }


        let userCourseList = await Controller.getUserCourseList() || {}
        let userPrograms: Structs.UPrograms = {}

        programIds.forEach(async programId => {
            let program: Structs.UProgram = {
                ...PROGRAMS[programId],
                contributionByCompleteCourses: 0,
                finalContributionByCurrentCourses: 0,
                presentContributionByCurrentCourses: 0,
                inCompleteCourses: {},
                currentCourses: {},
                completeCourses: {}
            }

            if (program) {
                program.courses.forEach(courseId => {
                    const course = { ...userCourseList[courseId], ...COURSES[courseId] }

                    if (!userCourseList[courseId]) {
                        program.inCompleteCourses[courseId] = course
                    }

                    else if (Controller.calcCourseProgress(course) === 100) {
                        program.completeCourses[courseId] = course
                    }

                    else {
                        program.currentCourses[courseId] = course
                    }
                })
                Controller.calcAndFillProgramProgression(program)
                userPrograms[programId] = program
            }
        })

        if (options.sort_by) {
            userPrograms = Controller.sortUserProgramList(userPrograms, options.sort_by)
        }
        if (typeof programId === 'string') {
            return userPrograms[programId]
        }
        return userPrograms
    }

    public static async getUserProgramList(options: { sort_by?: 'progress' } = {}): Promise<Structs.UPrograms> {
        let userCourses = await Controller.getUserCourseList() || {}
        let allPrograms = new Set()
        for (let cid in userCourses) {
            let programs = userCourses[cid].programs
            if (Array.isArray(programs)) {
                programs.forEach(pid => allPrograms.add(pid))
            }
        }
        return Controller.getUserProgramStats(Array.from(allPrograms), options) as Promise<Structs.UPrograms>
    }

    private static calcAndFillProgramProgression(program: Structs.UProgram) {
        let completeCredits = 0
        for (let courseId in program.completeCourses) {
            let course = program.completeCourses[courseId]
            completeCredits += course.credits
        }
        program.contributionByCompleteCourses = (completeCredits / program.totalCredits) * 100

        let currentCredits = 0, currentCoursesProgress = 0, x = 0 // to avoid division by zero err
        for (let courseId in program.currentCourses) {
            let course = program.currentCourses[courseId]
            let courseCompletionPercent = Controller.calcCourseProgress(course)
            x += (course.credits * courseCompletionPercent) / 100
            currentCoursesProgress += courseCompletionPercent
            currentCredits += course.credits
        }
        program.finalContributionByCurrentCourses = (currentCredits / program.totalCredits) * 100
        program.presentContributionByCurrentCourses = (x / program.totalCredits) * 100
        return
    }

    private static sortUserProgramList(userProgramList, sortModifier) {
        let userProgramListSorted = {}
        switch (sortModifier) {
            case 'progress':
                userProgramListSorted = sortObject(userProgramList, (programA: Structs.UProgram, programB: Structs.UProgram) => {
                    let a_reqCreditsAsPct = (programA.requiredCredits / programA.totalCredits) * 100
                    let b_reqCreditsAsPct = (programB.requiredCredits / programB.totalCredits) * 100
                    let a_progress = (programA.contributionByCompleteCourses + programA.presentContributionByCurrentCourses) / a_reqCreditsAsPct
                    let b_progress = (programB.contributionByCompleteCourses + programB.presentContributionByCurrentCourses) / b_reqCreditsAsPct
                    if (a_progress < b_progress) return 1
                    if (a_progress > b_progress) return -1
                    else return 0
                })
                break;

            default:
                break;
        }
        return userProgramListSorted
    }

    // public static getLastScrapeTime(): Promise<Date> {
    //     return new Promise((resolve, reject) => {
    //         chrome.storage.sync.get('lastScrapeTime', (items) => {
    //             resolve(items['lastScrapeTime'])
    //         })
    //     })
    // }

    public static getActiveSemester(): Constants.Semester {
        let currentMonth = new Date().getMonth() + 1
        let { Fall, Spring, Winter } = Constants.Semester
        // This function will fail terribly if earlier months are computed first because currentMonth will likely be greater than say Winter(1) or Spring(4)
        if (currentMonth >= Fall)
            return Fall
        if (currentMonth >= Spring)
            return Spring
        if (currentMonth >= Winter)
            return Winter
    }



    public static calcCourseProgress(courseOrCourses: Structs.UCourse | Structs.UCourse[]): number {
        if (isArray(courseOrCourses)) {
            let courses = courseOrCourses as Structs.UCourse[]
            let coursesProgress = {}
            courses.forEach(course => {
                coursesProgress[course.cid] = Controller.calcCourseProgress(course)
            })
        }
        else {
            let course = courseOrCourses as Structs.UCourse
            let today = new Date()
            if (!course.endDate || !course.startDate) {
                console.error('ERRORED AT: ', Date.now(), 'ON', course.cid)
                throw new TypeError(`startDate and endDate of course cannot be null or undefined. It must be a ISO Formatted Date or a string of value 'NOT_RELEVANT_ANYMORE' that concludes the course is fully complete`)
            }
            if (course.endDate === 'NOT_RELEVANT_ANYMORE' && course.startDate === 'NOT_RELEVANT_ANYMORE') {
                return 100
            }

            let courseStartDate = new Date(course.startDate)
            let millisSinceCourseStart = today.getTime() - courseStartDate.getTime()
            if (millisSinceCourseStart < 0) {
                return 0
            }

            let courseLengthInMillis = (new Date(course.endDate).getTime() - courseStartDate.getTime())
            return (millisSinceCourseStart / courseLengthInMillis) * 100;
        }
    }
}

function getItem(item: string) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(item, (res) => resolve(res[item] || null))
    })
}

function setItem(key: string, val: any) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set({ [key]: val }, () => resolve(true))
    })
}

export default Controller