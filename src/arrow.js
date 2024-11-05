import { createSVG } from './svg_utils';

export default class Arrow {
    constructor(gantt, from_task, to_task) {
        this.gantt = gantt;
        this.from_task = from_task;
        this.to_task = to_task;

        this.calculate_path();
        this.draw();
    }

    calculate_path() {
        const start_y =
            this.gantt.options.header_height +
            this.gantt.options.bar_height +
            (this.gantt.options.padding + this.gantt.options.bar_height) *
                this.from_task.task._row_index +
            this.gantt.options.padding;

        const end_y =
            this.gantt.options.header_height +
            this.gantt.options.bar_height / 2 +
            (this.gantt.options.padding + this.gantt.options.bar_height) *
                this.to_task.task._row_index +
            this.gantt.options.padding;

        let start_x =
            this.from_task.$bar.getX() + this.from_task.$bar.getWidth();
        let end_x = this.to_task.$bar.getX();

        const neighbor_row =
            Math.abs(this.from_task.task._row_index - this.to_task.task._row_index) <= 1;

        this.arrow_cascade_middle = false;
        if(this.gantt.options.arrow_cascade_middle &&
            (end_x - start_x) < this.gantt.options.arrow_padding &&
            end_x >= start_x-this.gantt.options.arrow_padding &&
            neighbor_row)
        {
            start_x = this.from_task.$bar.getX() + this.from_task.$bar.getWidth()/2;
            this.arrow_cascade_middle = true;
        }

        if(this.from_task.task.milestone) {
            start_x = this.from_task.$bar.getX() + this.from_task.$bar.getWidth()/2;
        }

        end_x = end_x - this.gantt.options.arrow_padding/2;

        //const condition = () =>
        //    this.to_task.$bar.getX() < start_x + this.gantt.options.arrow_padding &&
        //    start_x > this.from_task.$bar.getX() + this.gantt.options.arrow_padding;

        //while (condition()) {
        //    start_x -= 10;
        //}

        const from_is_below_to =
            this.from_task.task._row_index > this.to_task.task._row_index;
        const curve = this.gantt.options.arrow_curve;
        const clockwise = from_is_below_to ? 1 : 0;
        const counterclockwise = from_is_below_to ? 0 : 1;
        const curve_y = from_is_below_to ? -curve : curve;
        const offset = from_is_below_to
            ? end_y + this.gantt.options.arrow_curve
            : end_y - this.gantt.options.arrow_curve;

        this.path = `
            M ${start_x} ${start_y}
            V ${offset}
            a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve_y}
            L ${end_x} ${end_y}
            m -5 -5
            l 5 5
            l -5 5`;

        if(!this.gantt.options.arrow_down_right && !neighbor_row) {
            const down_1 = this.gantt.options.padding / 2 - curve;
            const left = this.to_task.$bar.getX() - this.gantt.options.arrow_padding - 3*curve;
            const down_2 =
                this.to_task.$bar.getY() +
                this.to_task.$bar.getHeight() / 2 -
                curve_y;
            this.path = `
                M ${start_x} ${start_y}
                v ${down_1}
                a ${curve} ${curve} 0 0 1 ${curve} ${curve}
                H ${left}
                a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve_y}
                V ${down_2}
                a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve_y}
                L ${end_x} ${end_y}
                m -5 -5
                l 5 5
                l -5 5`;
        }

        if ( end_x < start_x + this.gantt.options.arrow_padding ) {
            const down_1 = this.gantt.options.padding / 2 - curve;
            const down_2 =
                this.to_task.$bar.getY() +
                this.to_task.$bar.getHeight() / 2 -
                curve_y;
            const left = this.to_task.$bar.getX() - this.gantt.options.arrow_padding-curve;

            this.path = `
                M ${start_x} ${start_y}
                v ${down_1}
                a ${curve} ${curve} 0 0 1 -${curve} ${curve}
                H ${left}
                a ${curve} ${curve} 0 0 ${clockwise} -${curve} ${curve_y}
                V ${down_2}
                a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve_y}
                L ${end_x} ${end_y}
                m -5 -5
                l 5 5
                l -5 5`;
        }
    }

    is_critical() {
        return (this.from_task.task.critical && this.to_task.task.critical);
    }

    draw() {
        this.element = createSVG('path', {
            d: this.path,
            'data-from': this.from_task.task.id,
            'data-to': this.to_task.task.id,
            'class' : this.is_critical() ? 'critical-path' : ''
        });
    }

    update() {
        this.calculate_path();
        this.element.setAttribute('d', this.path);
    }
}
