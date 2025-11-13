import { Timestamp } from "firebase/firestore";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

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
    if (!date || typeof date.seconds === 'undefined' || typeof date.nanoseconds === 'undefined') {
        return '-';
    }

    try {
        const newTimestamp = new Timestamp(date.seconds, date.nanoseconds)
        const newDate = newTimestamp.toDate()
        let result

        let myDate = convertDate(newDate)
        result = `${myDate.day}/${myDate.month}/${myDate.year} - ${myDate.hours}:${myDate.minutes}:${myDate.seconds}`
        
        return result;
        
    } catch (e) {
        console.error("Erro na conversão de data Firestore:", e);
        return '-';
    }
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

export const isLoginOlderThanOneDay = (lastLoginDate: Date) => {
  // Tratamento para datas nulas ou inválidas (assume que o login é antigo se não existir).
  if (!(lastLoginDate instanceof Date) || isNaN(lastLoginDate.getTime())) {
    console.warn("A data de login é inválida ou nula. Assumindo que o login é antigo.");
    return true; 
  }

  // Calcula a diferença em milissegundos entre o AGORA e o ÚLTIMO LOGIN.
  const differenceMs = Date.now() - lastLoginDate.getTime();
  
  // Retorna TRUE se a diferença for maior que 1 dia (86.400.000 ms).
  return differenceMs > ONE_DAY_IN_MS;
}