import { plotchart, lollipopchart } from './all-chart.js'
import { updatecard } from './updatecard.js';
import { lateststatefetch, statenametostatecode } from './fetchlatest_statejson.js';
import { fetchdatajson } from './fetchdatajson.js';
import { fetchdataall } from './fetchdata-alljson.js';



const bubblecolormapper = {
    confirmcase: ["rgba(255,7,58,0.5)", "rgba(255,7,58,0.5)", "rgba(255,7,58,0.25)"],
    activecase: ['rgba(0,123,255,0.5)', 'rgba(0,123,255,0.5)', "rgba(0,123,255,0.25)"],
    recovercase: ["rgba(40,167,69,0.5)", "rgba(40,167,69,0.5)", "rgba(40,167,69,0.25)"],
    deathcase: ["rgba(108,117,125,0.7)", "rgba(108,117,125,1)", "rgba(108,117,125,0.4)"]
}
const chloroplethcolormapper = {
    confirmcase: [d3.interpolateReds, "rgba(255,7,58,0.5)"],
    activecase: [d3.interpolateBlues, "rgba(0,123,255,0.5)"],
    recovercase: [d3.interpolateGreens, "rgba(255,7,58,0.5)"],
    deathcase: [d3.interpolateGreys, "rgba(108,117,125,0.7)"]
}
//const a = new Date()
d3.select("#state-todaydate")
    .text(`15-Aug-2020`)
    //.text(`${a.getDate()}/${a.getMonth() + 1}/${a.getFullYear()}`)

let SessionStatename = localStorage.getItem('statename')
let SessionStatecode = localStorage.getItem('statecode')
if (SessionStatename && SessionStatecode) {
    document.getElementById('statename').innerText = SessionStatename + " " + SessionStatecode

    localStorage.setItem('change_cd_st', SessionStatecode)
}
else {
    SessionStatename = "Gujarat"
    SessionStatecode = "GJ"
    document.getElementById('statename').innerText = SessionStatename
    localStorage.setItem('change_cd_st', SessionStatecode)
}

function mapprojection(data) {
    const el = document.getElementById("statemap")
    const height = el.clientHeight
    const width = el.clientWidth
    const projection = d3.geoMercator();
    const pathGenerator = d3.geoPath().projection(projection);

    projection.scale(1).translate([0, 0])

    const b = pathGenerator.bounds(data),
        s = 0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    projection.scale(s).translate(t);

    return [projection, pathGenerator]
}

function eachstatetable(each_state_data) {

    d3.select('#stdt').append('td').text(each_state_data.statetotal.state)
    d3.select('#stdt').append('td').text(each_state_data.statetotal.confirmed)
    d3.select('#stdt').append('td').text(each_state_data.statetotal.active)
    d3.select('#stdt').append('td').text(each_state_data.statetotal.recovered)
    d3.select('#stdt').append('td').text(each_state_data.statetotal.deaths)


    const st_dst_dropdown = d3.select('#statedistrictselect')
    st_dst_dropdown.append('option').attr('value', SessionStatecode).text(each_state_data.statetotal.state)

    const eachstate_table = d3.select('#statetable')

    for (const iterator in each_state_data.districts) {
        const row = eachstate_table.append('tr').attr('class', 'item')
        if (iterator == "Other" || each_state_data.districts == "nodata") {


        }
        else {
            row.append('td').text(iterator)
            let cf = each_state_data.districts[iterator].total.confirmed ? each_state_data.districts[iterator].total.confirmed : 0
            let rc = each_state_data.districts[iterator].total.recovered ? each_state_data.districts[iterator].total.recovered : 0
            let dth = each_state_data.districts[iterator].total.deceased ? each_state_data.districts[iterator].total.deceased : 0
            let ac = cf - rc - dth
            row.append('td').text(cf)
            row.append('td').text(ac)
            row.append('td').text(rc)
            row.append('td').text(dth)

            st_dst_dropdown.append('option').attr('value', iterator).text(iterator)
        }
    }
}



async function process_latest_state_json() {
    let resdatajson = await fetchdatajson()
    let latest_state_json = await lateststatefetch()
    let staewise_data = resdatajson.statewise
    staewise_data.forEach(el => {
        if (latest_state_json[el.statecode]) {
            latest_state_json[el.statecode].statetotal = el;
        }
        else {
            latest_state_json[el.statecode] = { districts: "nodata", statetotal: el }
        }
    })

    return latest_state_json
}

async function main() {
    let latest_state_json = await process_latest_state_json()

    const state_card_data = latest_state_json[SessionStatecode].statetotal
    updatecard("state-total-confirmed-data", state_card_data.confirmed, "state-confirmed-change", state_card_data.deltaconfirmed)
    updatecard("state-total-active-data", state_card_data.active, "state-active-change", 0)
    updatecard("state-total-recovered-data", state_card_data.recovered, "state-recovered-change", state_card_data.deltarecovered)
    updatecard("state-total-death-data", state_card_data.deaths, "state-death-change", state_card_data.deltadeaths)


    eachstatetable(latest_state_json[SessionStatecode])

    const maxdata = {
        confirmcase: state_card_data.confirmed,
        activecase: state_card_data.active,
        recovercase: state_card_data.recovered,
        deathcase: state_card_data.recovered
    }
    const each_state_topo = await fetchspecificmapdata()
    const each_state_geojson = topojson.feature(each_state_topo, each_state_topo.objects.districts)
    const each_state_mesh = topojson.mesh(each_state_topo, each_state_topo.objects.districts)


    each_state_bubble(each_state_geojson, maxdata, "activecase")
    each_state_border(each_state_geojson, each_state_mesh, "activecase")
    buttontoggle(each_state_geojson, each_state_mesh, maxdata)

}
main()
async function fetchspecificmapdata() {
    const nocasedata = { confirmcase: 0, activecase: 0, recovercase: 0, deathcase: 0 }

    //let res = await fetch(`../mapdata/${SessionStatename}.json`)
    let res = await fetch(`https://raw.githubusercontent.com/virengajera/data-covid19india/main/mapdata/${SessionStatename}.json`)
    let each_state_map_data = await res.json()
    let latest_state_json = await process_latest_state_json()

    let each_district_data = latest_state_json[SessionStatecode].districts


    each_state_map_data.objects.districts.geometries.forEach(el => {
        if (each_district_data[el.properties.district]) {
            const total_data = each_district_data[el.properties.district].total

            const cf = total_data.confirmed ? total_data.confirmed : 0
            const rc = total_data.recovered ? total_data.recovered : 0
            const dth = total_data.deceased ? total_data.deceased : 0
            let ac;
            if ((cf - rc - dth) < 0) { ac = 0 } else { ac = cf - rc - dth }
            el.properties['totalcasedata'] = { confirmcase: cf, activecase: ac, recovercase: rc, deathcase: dth }
        }
        else {
            el.properties['totalcasedata'] = nocasedata
        }

    })

    return each_state_map_data

}

function each_state_border(each_state_geojson, each_state_mesh, casetype) {


    let mapprojectionresult = mapprojection(each_state_geojson)
    d3.select('#each-state-border')
        .append("path")
        .attr("stroke", bubblecolormapper[casetype][2])
        .attr("stroke-width", 1.5)
        .style('z-index', 5)
        .attr('fill', 'none')
        .attr("d", mapprojectionresult[1](each_state_mesh));

}

function updatemaphoverdata(d, i) {

    const a1 = d3.select('#statemap-district-name')
    const a2 = d3.select('#statemap-district-total-confirmed')
    const a3 = d3.select('#statemap-district-total-active')
    const a4 = d3.select('#statemap-district-total-recover')
    const a5 = d3.select('#statemap-district-total-death')

    a1.text("District : " + i.properties.district)
    a2.text("Total Confirmed : " + i.properties.totalcasedata.confirmcase)
    a3.text("Total Active : " + i.properties.totalcasedata.activecase)
    a4.text("Total Recovered : " + i.properties.totalcasedata.recovercase)
    a5.text("Total Death : " + i.properties.totalcasedata.deathcase)
}

function each_state_chloro(each_state_geojson, maxdata, casetype) {

    const mapprojectionresult = mapprojection(each_state_geojson)

    const color = d3.scaleSequentialLog(chloroplethcolormapper[casetype][0]).domain([1, maxdata[casetype]])

    const g = d3.select('#each-state-chloro')

    g.selectAll('path')
        .data(each_state_geojson.features)
        .enter()
        .append('path')
        .attr('d', (data) => mapprojectionresult[1](data))
        .attr('fill', (el) => color(el.properties.totalcasedata[casetype]))
        .attr('stroke-width', 0.5)
        .attr('stroke', 'black')
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut)

    function handleMouseOver(d, i) {

        updatemaphoverdata(d, i)
        d3.select(this)
            .attr('stroke-width', 2)

    }
    function handleMouseOut(d, i) {
        d3.select(this)
            .attr('stroke-width', 0.5)

    }

}


function each_state_bubble(each_state_geojson, maxdata, casetype) {

    const g = d3.select('#each-state-bubble')

    const bubbleradius = d3.scaleSqrt()
        .domain([0, maxdata[casetype]])
        .range([3, 80]);

    const mapprojectionresult = mapprojection(each_state_geojson)

    const sorteddata = each_state_geojson.features.sort((a, b) => b.properties.totalcasedata[casetype] - a.properties.totalcasedata[casetype])

    g.selectAll('circle')
        .data(sorteddata)
        .enter()
        .append('circle')
        .attr('cx', (el) => mapprojectionresult[0](d3.geoCentroid(el))[0])
        .attr('cy', (el) => mapprojectionresult[0](d3.geoCentroid(el))[1])
        .attr('r', (el) => bubbleradius(el.properties.totalcasedata[casetype]))
        .attr('stroke', bubblecolormapper[casetype][0])
        .attr('fill', bubblecolormapper[casetype][0])
        .attr('fill-opacity', 0.25)
        .attr('stroke-width', 2)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut)

    function handleMouseOver(d, i) {
        updatemaphoverdata(d, i)
        d3.select(this)
            .attr("fill-opacity", 1)
            .attr('stroke', bubblecolormapper[casetype][1])


    }
    function handleMouseOut(d, i) {
        d3.select(this).attr("fill-opacity", 0.25)
            .attr('stroke', bubblecolormapper[casetype][0]);

    }



}





function buttonvaluecheck(btnarray, each_state_geojson, each_state_mesh, maxdata) {
    d3.select('#each-state-border').selectAll('path').remove()
    d3.select('#each-state-chloro').selectAll('path').remove()
    d3.select('#each-state-bubble').selectAll('circle').remove()

    const nwbtnarry = btnarray.filter(a => a.classed('active'))
    const nwbtnarry2 = nwbtnarry.map(a => a.attr('value'))
    if (nwbtnarry2.includes("chloro")) {
        if (nwbtnarry2.includes("activecase")) {
            each_state_chloro(each_state_geojson, maxdata, "activecase")

        }
        else if (nwbtnarry2.includes("confirmcase")) {
            each_state_chloro(each_state_geojson, maxdata, "confirmcase")

        }
        else if (nwbtnarry2.includes("deathcase")) {

            each_state_chloro(each_state_geojson, maxdata, "deathcase")

        }
        else {
            each_state_chloro(each_state_geojson, maxdata, "recovercase")

        }
    }
    else if (nwbtnarry2.includes("bubble")) {

        if (nwbtnarry2.includes("activecase")) {
            each_state_border(each_state_geojson, each_state_mesh, "activecase")
            each_state_bubble(each_state_geojson, maxdata, "activecase")

        }
        else if (nwbtnarry2.includes("confirmcase")) {
            each_state_border(each_state_geojson, each_state_mesh, "confirmcase")
            each_state_bubble(each_state_geojson, maxdata, "confirmcase")

        }
        else if (nwbtnarry2.includes("deathcase")) {
            each_state_border(each_state_geojson, each_state_mesh, "deathcase")
            each_state_bubble(each_state_geojson, maxdata, "deathcase")


        }
        else {
            each_state_border(each_state_geojson, each_state_mesh, "recovercase")
            each_state_bubble(each_state_geojson, maxdata, "recovercase")

        }
    }
    else {

    }
}
function buttontoggle(each_state_geojson, each_state_mesh, maxdata) {
    const btn1 = d3.select('#each-state-chloro-btn')
    const btn2 = d3.select('#each-state-bubble-btn')
    const btn3 = d3.select('#each-state-active-btn')
    const btn4 = d3.select('#each-state-confirm-btn')
    const btn5 = d3.select('#each-state-recover-btn')
    const btn6 = d3.select('#each-state-death-btn')

    const btnarr = new Array(btn1, btn2, btn3, btn4, btn5, btn6);



    btn1.on('click', (e, i) => {
        if (btn1.classed('active')) {

        }
        else {
            btn1.classed('active', true)
            btn2.classed('active', false)

        }
        buttonvaluecheck(btnarr, each_state_geojson, each_state_mesh, maxdata)

    })
    btn2.on('click', (e, i) => {
        if (btn2.classed('active')) {

        }
        else {
            btn2.classed('active', true)
            btn1.classed('active', false)

        }
        buttonvaluecheck(btnarr, each_state_geojson, each_state_mesh, maxdata)
    })
    btn3.on('click', () => {
        if (btn3.classed('active')) {

        }
        else {
            btn3.classed('active', true)
            btn4.classed('active', false)
            btn5.classed('active', false)
            btn6.classed('active', false)
        }
        buttonvaluecheck(btnarr, each_state_geojson, each_state_mesh, maxdata)
    })
    btn4.on('click', () => {
        if (btn4.classed('active')) {

        }
        else {
            btn4.classed('active', true)
            btn5.classed('active', false)
            btn6.classed('active', false)
            btn3.classed('active', false)
        }
        buttonvaluecheck(btnarr, each_state_geojson, each_state_mesh, maxdata)
    })
    btn5.on('click', () => {
        if (btn5.classed('active')) {

        }
        else {
            btn5.classed('active', true)
            btn6.classed('active', false)
            btn3.classed('active', false)
            btn4.classed('active', false)
        }
        buttonvaluecheck(btnarr, each_state_geojson, each_state_mesh, maxdata)
    })
    btn6.on('click', () => {
        if (btn6.classed('active')) {

        }
        else {
            btn6.classed('active', true)
            btn3.classed('active', false)
            btn4.classed('active', false)
            btn5.classed('active', false)
        }
        buttonvaluecheck(btnarr, each_state_geojson, each_state_mesh, maxdata)
    })
}
buttontoggle()



async function fetch_datall(SessionStatecode, case_btn_cty) {

    const each_st_series_all_data = await fetchdataall(SessionStatecode)

    plt_chart(each_st_series_all_data, SessionStatecode, case_btn_cty)
    chart_button_toggle(each_st_series_all_data)
    dropdownchange(each_st_series_all_data)
}
fetch_datall(SessionStatecode)


function plt_chart(each_st_series_all_data, change_cd, case_btn_category="total") {
    if (case_btn_category == "total") {
        plotchart("st-confirm-chart", "confirmed", each_st_series_all_data[change_cd], case_btn_category)
        plotchart("st-active-chart", "active", each_st_series_all_data[change_cd], case_btn_category)
        plotchart("st-recover-chart", "recovered", each_st_series_all_data[change_cd], case_btn_category)
        plotchart("st-death-chart", "deceased", each_st_series_all_data[change_cd], case_btn_category)
    }
    else {
        lollipopchart("st-confirm-chart", "confirmed", each_st_series_all_data[change_cd], case_btn_category)
        lollipopchart("st-active-chart", "active", each_st_series_all_data[change_cd], case_btn_category)
        lollipopchart("st-recover-chart", "recovered", each_st_series_all_data[change_cd], case_btn_category)
        lollipopchart("st-death-chart", "deceased", each_st_series_all_data[change_cd], case_btn_category)
    }

}

function dropdownchange(each_st_series_all_data) {
    d3.select('#statedistrictselect').on('change', drop_down_change)
    function drop_down_change(){


    d3.selectAll('.firstg').remove()

    const change_cd = d3.select(this).property('value')

    const btnc = d3.select('#st-cummulative-chart-btn')
//    const btnd = d3.select('#st-daily-chart-btn')
    localStorage.setItem('change_cd_st', change_cd)
    if (btnc.classed('active')) {

        plt_chart(each_st_series_all_data, change_cd, "total")
    }
    else {
        
        plt_chart(each_st_series_all_data, change_cd, "delta")
        
    }
}

}

function chart_button_toggle_check(a, each_st_series_all_data) {
    d3.selectAll('.firstg').remove()
    const nwbtnarry = a.filter(d => d.classed('active'))
    const nwbtnarry2 = nwbtnarry.map(d => d.attr('value'))
    if (nwbtnarry2.includes('total')) {
        plt_chart(each_st_series_all_data, localStorage.getItem('change_cd_st'), "total")

    }
    else {
        
        plt_chart(each_st_series_all_data, localStorage.getItem('change_cd_st'), "delta")

    }
}



function chart_button_toggle(each_st_series_all_data) {


    const btnc = d3.select('#st-cummulative-chart-btn')
    const btnd = d3.select('#st-daily-chart-btn')
    btnc.on('click', () => {
        if (btnc.classed('active')) {

        }
        else {
            btnc.classed('active', true)
            btnd.classed('active', false)
            chart_button_toggle_check(new Array(btnc, btnd), each_st_series_all_data)
        }
    })
    btnd.on('click', () => {

        if (btnd.classed('active')) {

        }
        else {
            btnd.classed('active', true)
            btnc.classed('active', false)
            chart_button_toggle_check(new Array(btnc, btnd), each_st_series_all_data)
        }
    })
}
