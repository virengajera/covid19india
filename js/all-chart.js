const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}
const DateFormatter = (dt) => {
    const formatTime = d3.timeFormat("%d %b, %Y");
    return formatTime(new Date(dt))

}
const bisect = d3.bisector(function (d) { return new Date(d[0]); }).left;
const all_scales = {};


function updatechartinfo(selectedData, case_category, casetype, all_scales) {
    let stxtcf, stxtac, stxtrc, stxtdth
    if (case_category == "total") {
        stxtcf = `Confirm Cases: ${selectedData[1].total.confirmed} (${DateFormatter(selectedData[0])})`
        stxtac = `Active Cases: ${selectedData[1].total.active} (${DateFormatter(selectedData[0])})`
        stxtrc = `Recover Cases: ${selectedData[1].total.recovered} (${DateFormatter(selectedData[0])})`
        stxtdth = `Death Cases: ${selectedData[1].total.deceased} (${DateFormatter(selectedData[0])})`
    }
    else {
        stxtcf = `Daily Confirmed Cases: ${selectedData[1].delta.confirmed} (${DateFormatter(selectedData[0])})`
        stxtac = `Daily Active Cases: ${selectedData[1].delta.active} (${DateFormatter(selectedData[0])})`
        stxtrc = `Daily Recovered Cases: ${selectedData[1].delta.recovered} (${DateFormatter(selectedData[0])})`
        stxtdth = `Daily Death Cases: ${selectedData[1].delta.deceased} (${DateFormatter(selectedData[0])})`

    }


    d3.select("#info-confirmed").text(stxtcf)
    d3.select("#info-active").text(stxtac)
    d3.select("#info-recovered").text(stxtrc)
    d3.select("#info-deceased").text(stxtdth)

    const focus_cf = d3.select('#focus-confirmed').select('circle')
    const focus_ac = d3.select('#focus-active').select('circle')
    const focus_rc = d3.select('#focus-recovered').select('circle')
    const focus_dth = d3.select('#focus-deceased').select('circle')
    if (casetype == "confirmed") {
        focus_ac
            .attr('cx', all_scales.active.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.active.yscale(selectedData[1][case_category].active))
        focus_rc
            .attr('cx', all_scales.recovered.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.recovered.yscale(selectedData[1][case_category].recovered))
        focus_dth
            .attr('cx', all_scales.deceased.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.deceased.yscale(selectedData[1][case_category].deceased))

    }
    else if (casetype == "active") {

        focus_cf
            .attr('cx', all_scales.confirmed.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.confirmed.yscale(selectedData[1][case_category].confirmed))
        focus_rc
            .attr('cx', all_scales.recovered.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.recovered.yscale(selectedData[1][case_category].recovered))
        focus_dth
            .attr('cx', all_scales.deceased.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.deceased.yscale(selectedData[1][case_category].deceased))
    }
    else if (casetype == "recovered") {
        focus_cf
            .attr('cx', all_scales.confirmed.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.confirmed.yscale(selectedData[1][case_category].confirmed))
        focus_ac
            .attr('cx', all_scales.active.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.active.yscale(selectedData[1][case_category].active))
        focus_dth
            .attr('cx', all_scales.deceased.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.deceased.yscale(selectedData[1][case_category].deceased))

    }
    else {
        focus_cf
            .attr('cx', all_scales.confirmed.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.confirmed.yscale(selectedData[1][case_category].confirmed))
        focus_ac
            .attr('cx', all_scales.active.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.active.yscale(selectedData[1][case_category].active))
        focus_rc
            .attr('cx', all_scales.recovered.xscale(new Date(selectedData[0])))
            .attr('cy', all_scales.recovered.yscale(selectedData[1][case_category].recovered))

    }
}

export function plotchart(selection_id, casetype, seriresdata, case_category = "total") {

    const chartcolors = {
        confirmed: ['#ff073a', '#ff073a50'],
        active: ['#007bff', '#007bff50'],
        recovered: ['#28a745', '#28a74550'],
        deceased: ['#d2d6da', '#6c757d50']
    }

    const d2 = Object.entries(seriresdata.dates)

    const d2l = d2.length
    // set the dimensions and margins of the graph
    const margin = { top: 5, right: 45, bottom: 30, left: 15 },
        width = document.getElementById(selection_id).clientWidth - margin.left - margin.right,
        height = document.getElementById(selection_id).clientHeight - margin.top - margin.bottom;


    // append the svg object to the body of the page
    const svg = d3.select("#" + selection_id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr('class', 'firstg')


    // Initialise a X axis:
    const x = d3.scaleTime().range([width, 0]);
    const xAxis = d3.axisBottom().scale(x).ticks(5).tickFormat(d3.timeFormat("%d %b"));
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "cummulative-xaxis")
        .attr('stroke', chartcolors[casetype][0])
        .attr('color', chartcolors[casetype][0])

    // Initialize an Y axis
    const y = d3.scaleLinear().range([height, 0]);
    const yAxis = d3.axisRight().scale(y).tickFormat((d3.format('.2s')));
    svg.append("g")
        .attr("class", "cummulative-yaxis")
        .attr("transform", `translate(${width},0)`)
        .attr('stroke', chartcolors[casetype][0])
        .attr('color', chartcolors[casetype][0])

    // Create the X axis:

    x.domain([new Date(d2[d2l - 1][0]), new Date(d2[0][0])]);
    svg.selectAll(".cummulative-xaxis").call(xAxis);


    // create the Y axis
    const minmax = d3.extent(d2, function (d) { return d[1][case_category][casetype] })
    y.domain([minmax[0], minmax[1] * 1.2]);
    svg.selectAll(".cummulative-yaxis")
        .call(yAxis);
    // Create a function that takes a dataset as input and update the plot:

    all_scales[casetype] = { xscale: x, yscale: y }

    let cummulative_circle = svg.selectAll(".cummulative-circle")
        .data(d2);


    // Updata the line
    cummulative_circle
        .enter()
        .append("circle")
        .attr("class", "cummulative-circle")
        .merge(cummulative_circle)
        .attr('cx', (d) => x(new Date(d[0])))
        .attr('cy', (d) => y(d[1][case_category][casetype]))
        .attr("stroke", "steelblue")
        .attr('r', 2)
        .attr('fill', chartcolors[casetype][0])
        .attr('stroke', chartcolors[casetype][0])


    // Create a update selection: bind to the new data
    let cummulative_line = svg.selectAll(".cummulative-line")
        .data([d2]);

    // Updata the line
    cummulative_line
        .enter()
        .append("path")
        .attr("class", "cummulative-line")
        .merge(cummulative_line)
        .transition()
        .duration(1000)
        .attr("d", d3.line()
            .x(function (d) { return x(new Date(d[0])) })
            .y(function (d) { return y(d[1][case_category][casetype]); }))
        .attr("fill", "none")
        .attr("stroke", chartcolors[casetype][1])
        .attr("stroke-width", 4)

    svg
        .append('g')
        .attr('id', 'focus-' + casetype)
        .append('circle')
        .style("fill", "black")
        .attr("stroke", "white")
        .attr('stroke-width', 1.2)
        .attr('r', 4)
        .attr('cx', x(new Date(d2[d2l - 1][0])))
        .attr('cy', y(d2[d2l - 1][1][case_category][casetype]))
        .style("opacity", 1)

    svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width )
        .attr('height', height)
        .on('mousemove touchmove', mousemove)



    const h4sel = "#info-" + casetype
    let stxt = `${capitalize(casetype)} Cases: ${d2[d2l - 1][1][case_category][casetype]} (${DateFormatter(d2[d2l - 1][0])}))`
    d3.select(h4sel).text(stxt)


    function mousemove(event) {
        const coords = d3.pointer(event, this);
        const xcord = x.invert(coords[0])
        const i = bisect(d2, xcord, 1);
        const selectedData = d2[i]
        if (selectedData) {
            updatechartinfo(selectedData, case_category, casetype, all_scales)
            d3.select('#focus-' + casetype)
                .select('circle')
                .attr("cx", x(new Date(selectedData[0])))
                .attr("cy", y(selectedData[1][case_category][casetype]))


        }



    }



}


export function lollipopchart(selection_id, casetype, seriresdata, case_category = "delta") {
    const lollipopcolors = {
        confirmed: ['#ff073a', 'rgba(255,7,58,0.6)'],
        active: ['#007bff', 'rgba(0,123,255,0.6)'],
        recovered: ['#28a745', 'rgba(40,167,69,0.6)'],
        deceased: ['#d2d6da', '#d2d6da50']
    }

    const d2 = Object.entries(seriresdata.dates)
    const d2l = d2.length


    let margin = { top: 5, right: 45, bottom: 30, left: 15 },
        width = document.getElementById(selection_id).clientWidth - margin.left - margin.right,
        height = document.getElementById(selection_id).clientHeight - margin.top - margin.bottom;



    // append the svg object to the body of the page
    let svg = d3.select("#" + selection_id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr('class', 'firstg');

    const x = d3.scaleTime().range([width, 0]);
    const xAxis = d3.axisBottom().scale(x).ticks(5).tickFormat(d3.timeFormat("%d %b"));
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "dateaxis2")
        .attr('stroke', lollipopcolors[casetype][1])
        .attr('color', lollipopcolors[casetype][1])

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")


    const y = d3.scaleLinear().range([height, 0]);
    const yAxis = d3.axisRight().scale(y).tickFormat((d3.format('.2s')));
    svg.append("g")
        .attr("class", "casecount2")
        .attr("transform", `translate(${width},0)`)
        .attr('stroke', lollipopcolors[casetype][1])
        .attr('color', lollipopcolors[casetype][1])

    // Create the X axis:
    const all_dates = d2.map((d) => new Date(d[0]))
    x.domain([new Date(d2[d2l - 1][0]), new Date(d2[0][0])]);
    svg.selectAll(".dateaxis2").call(xAxis);


    const minmax = d3.extent(d2, function (d) { return d[1][case_category][casetype] })
    y.domain([minmax[0] * 1.2, minmax[1] * 1.2]);
    svg.selectAll(".casecount2")
        .call(yAxis);


    all_scales[casetype] = { xscale: x, yscale: y }

    // variable u: map data to existing circle
    let lollipop_lines = svg.selectAll(".myLine2")
        .data(d2)
    // update lines
    lollipop_lines
        .enter()
        .append("line")
        .attr("class", "myLine2")
        .merge(lollipop_lines)
        .attr("x1", (d) => x(new Date(d[0])))
        .attr("y1", (d) => y(d[1][case_category][casetype]))
        .attr("x2", (d) => x(new Date(d[0])))
        .attr("y2", (d) => y(0))
        .attr("stroke", lollipopcolors[casetype][1])
        .attr('stroke-width', 1)


    // variable u: map data to existing circle
    let lollipop_circle = svg.selectAll("circle2")
        .data(d2)
    // update bars or lines
    lollipop_circle
        .enter()
        .append("circle")
        .merge(lollipop_circle)
        .transition()
        .attr("cx", (d) => x(new Date(d[0])))
        .attr("cy", (d) => y(d[1][case_category][casetype]))
        .attr("r", 0.5)
        .attr("fill", lollipopcolors[casetype][0])
        .attr('stroke', lollipopcolors[casetype][0])


    const h4sel = "#info-" + casetype
    let stxt = `Daily ${capitalize(casetype)} Cases: ${d2[d2l - 1][1][case_category][casetype]} (${DateFormatter(d2[d2l - 1][0])}))`
    d3.select(h4sel).text(stxt)


    svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .on('mousemove', mousemove)



    svg
        .append('g')
        .attr('id', 'focus-' + casetype)
        .append('circle')
        .style("fill", "black")
        .attr("stroke", "white")
        .attr('stroke-width', 1.2)
        .attr('r', 4)
        .attr('cx', x(new Date(d2[d2l - 1][0])))
        .attr('cy', y(d2[d2l - 1][1][case_category][casetype]))
        .style("opacity", 1)

    function mousemove(event) {
        const coords = d3.pointer(event, this);
        const xcord = x.invert(coords[0])
        const i = bisect(d2, xcord, 1);
        const selectedData = d2[i]

        if (selectedData) {
            updatechartinfo(selectedData, case_category, casetype, all_scales)
            d3.select('#focus-' + casetype)
                .select('circle')
                .attr("cx", x(new Date(selectedData[0])))
                .attr("cy", y(selectedData[1][case_category][casetype]))

        }



    }


}
