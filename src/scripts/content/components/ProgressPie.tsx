import * as React from "react";
import { round } from '../../common/Utils'
interface IProgressPieProps {
    data: { value?: number, isMarker?: boolean, color: string }[],
    radius?: number;
    strokeSize?: number;
}

interface IProgressPieState {
    paused: boolean;
};

class ProgressPie extends React.Component<IProgressPieProps, IProgressPieState> {
    constructor(props) {
        super()
        this.state = {
            paused: true
        }
    }
    componentDidMount() {
        setTimeout(() => {
            this.setState({ paused: false }, () => {
            })
        }, 250);
    }
    public render() {
        let radius = this.props.radius || 10
        let strokeSize = this.props.strokeSize || 10
        let data = this.props.data
        // let svgBox = (radius * 2) + (radius * 2 * .14);
        let svgBox = (radius * 2) + (strokeSize * 1.2);
        // let circlePos = radius + (radius * .10);
        let circlePos = svgBox / 2;
        let c = 2 * Math.PI * radius
        // console.log('c', c);
        let pieTotal = 0
        let rings = []
        let ringStyles = { transition: '1s all' }
        for (let i = 0, len = data.length; i < len; i++) {
            let val = data[i].value
            if (!val && data[i].isMarker) {
                let rotation = (pieTotal * 360) / 100
                let style = {
                    transformOrigin: 'center',
                    transform: `rotate(${rotation}deg)`
                }
                let markerStrokeSize = (strokeSize * .5) + strokeSize
                rings.push(
                    <g key={i} style={style}>
                        <circle
                            className={`progress-ring`}
                            r={`${radius}`}
                            cx={`${circlePos}`}
                            cy={`${circlePos}`}
                            fill={`transparent`}
                            strokeDasharray={`565.48`}
                            stroke={`transparent`}
                            strokeDashoffset={`0`}
                            strokeWidth={`${markerStrokeSize}`}>
                        </circle>
                        <circle
                            style={ringStyles}
                            shapeRendering="geometricPrecision"
                            data-value={val}
                            className={`progress-ring`}
                            r={`${radius}`}
                            cx={`${circlePos}`}
                            cy={`${circlePos}`}
                            fill={`transparent`}
                            strokeDasharray={`565.48`}
                            stroke={`${data[i].color}`}
                            strokeDashoffset={`564.5`}
                            strokeWidth={`${markerStrokeSize}`}>
                        </circle>
                    </g>
                )
                continue
            }
            if (val > 100) val = 100
            if (this.state.paused) {
                val = 0
            }
            if (pieTotal + val > 100) {
                val = 100 - pieTotal
            }
            let offset = 565.48 - ((val * c) / 100)
            let rotation = (pieTotal * 360) / 100
            let style = {
                transformOrigin: 'center',
                transform: `rotate(${rotation}deg)`
            }
            rings.push(
                <g key={i} style={style}>
                    <circle
                        className={`progress-ring`}
                        r={`${radius}`}
                        cx={`${circlePos}`}
                        cy={`${circlePos}`}
                        fill={`transparent`}
                        strokeDasharray={`565.48`}
                        stroke={`transparent`}
                        strokeDashoffset={`0`}
                        strokeWidth={`${strokeSize}`}>
                    </circle>
                    <circle
                        style={ringStyles}
                        shapeRendering="geometricPrecision"
                        data-value={val}
                        className={`progress-ring`}
                        r={`${radius}`}
                        cx={`${circlePos}`}
                        cy={`${circlePos}`}
                        fill={`transparent`}
                        strokeDasharray={`565.48`}
                        stroke={`${data[i].color}`}
                        strokeDashoffset={`${(offset)}`}
                        strokeWidth={`${strokeSize}`}>
                    </circle>
                </g>
            )
            pieTotal += val
        }
        rings.reverse()
        let fillerPieStyles = {
            transform: `rotate(${(360 * pieTotal) / 100}deg)`,
            transformOrigin: 'center'
        }
        let fillerPie = (
            <circle
                style={fillerPieStyles}
                shapeRendering="geometricPrecision"
                className="progress-ring-bg"
                r={`${radius}`}
                cx={`${circlePos}`}
                cy={`${circlePos}`}
                fill="transparent"
                stroke='#f3f3f3'
                strokeDasharray="565.48"
                strokeDashoffset={`${565.48 - (((100 - pieTotal) * c) / 100)}`}
                strokeWidth={`${strokeSize}`}>
            </circle>
        )

        let svgStyles = { transform: 'rotate(-90deg)' }
        if (!this.state.paused) {
            svgStyles = Object.assign({}, svgStyles, { transformOrigin: 'center' })
        }
        return (
            <svg width={svgBox} height={svgBox}>
                <g style={svgStyles}>
                    {fillerPie}
                    <g className="ring-cluster paused">
                        {rings}
                    </g>
                </g>
            </svg>
        );
    }
}

export default ProgressPie;


                    // <circle
                    //     className={`progress-ring`}
                    //     r={`${radius}`}
                    //     cx={`${circlePos}`}
                    //     cy={`${circlePos}`}
                    //     fill={`transparent`}
                    //     strokeDasharray={`565.48`}
                    //     stroke={`#dadada`}
                    //     strokeDashoffset={`${(progress - 0.60)}`}
                    //     strokeWidth={`${strokeSize}%`}>
                    // </circle>
