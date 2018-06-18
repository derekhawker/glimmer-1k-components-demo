import {interpolateViridis} from "d3-scale";
import S, {DataSignal} from "s-js";
import * as Surplus from "surplus";
import data from "surplus-mixin-data";

enum Layout {
    PHYLLOTAXIS = 0,
    GRID,
    WAVE,
    SPIRAL
}

const LAYOUT_ORDER = [
    Layout.PHYLLOTAXIS,
    Layout.SPIRAL,
    Layout.PHYLLOTAXIS,
    Layout.GRID,
    Layout.WAVE,
];

const theta = Math.PI * (3 - Math.sqrt(5));

export type Point = { x: number; y: number; color: string };

export const view = S.root(() => {
    let numPoints = S.data(1000);

    return (
        <div class="app-wrapper">
            <Visualization count={numPoints()}/>
            <div class="controls">
                # Points
                <input type="range"
                       min="10"
                       max="10000"
                       fn={data(numPoints)}/>
                {numPoints()}
            </div>
        </div>);
});
(document.getElementById("root") as HTMLElement).appendChild(view);

function Visualization(props: { count: number }) {
    const numSteps = 60 * 2;
    const phyllotaxis = genPhyllotaxis(props.count);
    const grid = genGrid(props.count);
    const wave = genWave(props.count);
    const spiral = genSpiral(props.count);

    const points = makePoints();

    let layout = 0;
    let step = 0;

    next();

    return (
        <svg class="demo">
            <g>
                {points.map(pt =>
                    <circle class="point"
                            r="4"
                            transform={`translate(${pt().x} ${pt().y})`}
                            fill={`${pt().color}`}/>)
                }
            </g>
        </svg>);

    function next() {
        step = ((step + 1) % numSteps);

        if (step === 0) {
            layout = (layout + 1) % LAYOUT_ORDER.length;
        }

        // Clamp the linear interpolation at 80% for a pause at each finished layout state
        const pct = Math.min(1, step / (numSteps * 0.8));

        const currentLayout = LAYOUT_ORDER[layout];
        const nextLayout = LAYOUT_ORDER[(layout + 1) % LAYOUT_ORDER.length];

        // Keep these redundant computations out of the loop
        const pxProp = xForLayout(currentLayout);
        const nxProp = xForLayout(nextLayout);
        const pyProp = yForLayout(currentLayout);
        const nyProp = yForLayout(nextLayout);

        S.freeze(() => {
            points.forEach(pt => {
                const newPoint = S.sample(pt);
                newPoint.x = lerp(newPoint, pct, pxProp, nxProp);
                newPoint.y = lerp(newPoint, pct, pyProp, nyProp);
                pt(newPoint);
            });
        });

        requestAnimationFrame(() => { next() });
    }

    function makePoints(): Array<DataSignal<Point>> {
        const newPoints = [];
        for (let i = 0; i < props.count; i++) {
            newPoints.push(S.data({
                ...findAnchors(i),
                x: 0,
                y: 0,
                color: interpolateViridis(i / props.count),
            }));
        }
        return newPoints;

        function findAnchors(i: number) {
            const [gx, gy] = project(grid(i));
            const [wx, wy] = project(wave(i));
            const [sx, sy] = project(spiral(i));
            const [px, py] = project(phyllotaxis(i));
            return { gx, gy, wx, wy, sx, sy, px, py };
        }
    }
}

function project(vector: Array<number>) {
    const wh = window.innerHeight / 2;
    const ww = window.innerWidth / 2;

    return translate([ww, wh], scale(Math.min(wh, ww), vector));

    function scale(magnitude: number, vector: Array<number>) {
        return vector.map(p => p * magnitude);
    }

    function translate(translation: Array<number>, vector: Array<number>) {
        return vector.map((p, i) => p + translation[i]);
    }
}

function lerp(obj: any,
              percent: number,
              startProp: string,
              endProp: string) {
    const px = obj[startProp];
    return px + (obj[endProp] - px) * percent;
}

function genPhyllotaxis(n: number) {
    return (i: number) => {
        const r = Math.sqrt(i / n);
        const th = i * theta;
        return [
            r * Math.cos(th),
            r * Math.sin(th),
        ];
    };
}

function genGrid(n: number) {
    const rowLength = Math.round(Math.sqrt(n));
    return (i: number) => [
        -0.8 + 1.6 / rowLength * (i % rowLength),
        -0.8 + 1.6 / rowLength * Math.floor(i / rowLength),
    ];
}

function genWave(n: number) {
    const xScale = 2 / (n - 1);
    return (i: number) => {
        const x = -1 + i * xScale;
        return [
            x,
            Math.sin(x * Math.PI * 3) * 0.3,
        ];
    };
}

function genSpiral(n: number) {
    return (i: number) => {
        const t = Math.sqrt(i / (n - 1));
        return [
            t * Math.cos(t * Math.PI * 10),
            t * Math.sin(t * Math.PI * 10),
        ];
    };
}

function xForLayout(layout: Layout) {
    switch (layout) {
        case Layout.PHYLLOTAXIS:
            return 'px';
        case Layout.GRID:
            return 'gx';
        case Layout.WAVE:
            return 'wx';
        case Layout.SPIRAL:
            return 'sx';
    }
}

function yForLayout(layout: Layout) {
    switch (layout) {
        case Layout.PHYLLOTAXIS:
            return 'py';
        case Layout.GRID:
            return 'gy';
        case Layout.WAVE:
            return 'wy';
        case Layout.SPIRAL:
            return 'sy';
    }
}
