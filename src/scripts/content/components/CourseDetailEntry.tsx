import * as React from "react";
import { Structs } from '../../common/Structs'
interface ICourseDetailEntryProps {
    course: Structs.Course
};

interface ICourseDetailsState { };

class CourseDetails extends React.Component<ICourseDetailEntryProps, ICourseDetailsState> {
    public render() {
        let { course } = this.props
        return (
            <tr >
                <td className='prog-trkr program-details-c c-id'>{course.cid.toUpperCase()}</td>
                <td className='prog-trkr program-details-c c-name'><span><a href={`http://www.bcit.ca/study/courses/${course.cid}`}>{course.name}</a></span></td>
                <td className='prog-trkr program-details-c c-credits'>{course.credits}</td>
            </tr>
        );
    }
}

export default CourseDetails;
