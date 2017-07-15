import { Server } from './Server'
import Chrome from './Chrome'
import { Structs } from '../common/Structs'
export class Scrapper {

    public static init() {
        Chrome.registerResponder({
            'ComputeCoursesWithMissingDuration': this.computeCoursesWithMissigDuration,
            'shouldAppAutoScrape': this.shouldAppAutoScrape,
            'MyBcitScrapeData': this.processMyBcitScrape,
            'D2lScrapeData': this.handleD2lScrape,
            'BcitCaScrapeData': this.handleBcitCaScrape
        })
    }





    private static shouldAppAutoScrape(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            // let lastScrapeTime = await Server.getLastScrapeTime()
            // if(!lastScrapeTime) {
            //     resolve(true)
            // }
            // if(lastScrapeTime.getMonth() + 1)
            // chrome.runtime.sendMessage('shouldAppAutoScrape', res => {
            //     console.log(res)
            //     resolve(false)
            // })
            resolve(false)
        })
    }

    // private static compareAndSaveMyBcitScrape(scrapedData: Structs.MyBCITScrape): Promise<boolean> {
    //     return new Promise(async (resolve, reject) => {
    //         let existingUserCourses = await Server.getUserCourses()
    //         let updatedUserCourses: Structs.UCourses = Object.assign({}, existingUserCourses)
    //         let didListChange = false
    //         for (let courseId in scrapedData) {
    //             let nowScrapedCourseData = scrapedData[courseId]
    //             let existingCourse = existingUserCourses[courseId]
    //             if (!existingCourse
    //                 ||
    //                 (nowScrapedCourseData.year > existingCourse.year)
    //                 ||
    //                 (nowScrapedCourseData.year === existingCourse.year && nowScrapedCourseData.semester > existingCourse.semester)
    //             ) {
    //                 updatedUserCourses[courseId] = {
    //                     crn: null,
    //                     startDate: null,
    //                     endDate: null,
    //                     semester: nowScrapedCourseData.semester,
    //                     year: nowScrapedCourseData.year
    //                 }
    //                 didListChange = true
    //             }
    //         }
    //         if (didListChange) {
    //             await Server.saveUserCourses(updatedUserCourses)
    //         }
    //         resolve(didListChange)
    //     })
    // }




}