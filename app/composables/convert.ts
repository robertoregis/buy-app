import { Timestamp } from "firebase/firestore"

export function convertDate(dateForConvert: any) {
    const date = dateForConvert
    let year = date.getFullYear()
    let month: any = date.getMonth() + 1
    if(Number(month) < 10) {
        month = `0${month}`
    } else {
        month = String(month)
    }
    let day: any = date.getDate()
    if(Number(day) < 10) {
        day = `0${day}`
    } else {
        day = String(day)
    }
    let hours: any = date.getHours()
    if(Number(hours) < 10) {
        hours = `0${hours}`
    } else {
        hours = String(hours)
    }
    let minutes: any = date.getMinutes()
    if(Number(minutes) < 10) {
        minutes = `0${minutes}`
    } else {
        minutes = String(minutes)
    }
    let seconds: any = date.getSeconds()
    if(Number(seconds) < 10) {
        seconds = `0${seconds}`
    } else {
        seconds = String(seconds)
    }
    return {
        day,
        month,
        year: String(year),
        hours,
        minutes,
        seconds
    }
}

export const convertDateFirestore = (date: any) => {
    const newTimestamp = new Timestamp(date.seconds, date.nanoseconds)
    const newDate = newTimestamp.toDate()
    let result
    if(newDate.getDate()) {
        let myDate = convertDate(newDate)
        result = `${myDate.day}/${myDate.month}/${myDate.year} - ${myDate.hours}:${myDate.minutes}:${myDate.seconds}`
    } else {
        result = '-'
    }
    return result
}

export const convertDateFirestoreFriends = (date: any) => {
    const newTimestamp = new Timestamp(date.seconds, date.nanoseconds)
    const newDate = newTimestamp.toDate()
    let result
    if(newDate.getDate()) {
        let myDate = convertDate(newDate)
        result = `amigos desde ${myDate.day}/${myDate.month}/${myDate.year}`
    } else {
        result = '-'
    }
    return result
}