import twilio from 'twilio'
import fs from 'fs'
import path from 'path'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhone = process.env.TWILIO_PHONE_NUMBER

let client: any = null
if (accountSid && authToken && accountSid.trim() && authToken.trim()) {
  client = twilio(accountSid, authToken)
}

function writeToLocalDebugLog(toPhone: string, otp: string, messageText: string, reason: string) {
  try {
    const logPath = path.join(process.cwd(), 'otp-debug.log')
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${reason}] To: ${toPhone} | OTP: ${otp} | Message: "${messageText}"\n`
    fs.appendFileSync(logPath, logMessage)
    console.log(`\n-----------------------------------------------\n[SMS DEBUG LOG WRITTEN to otp-debug.log] (${reason})\nTo: ${toPhone}\nMessage: ${messageText}\n-----------------------------------------------\n`)
  } catch (err) {
    console.error('Failed to write OTP to local debug file:', err)
  }
}

export async function sendOtpSms(toPhone: string, otp: string): Promise<boolean> {
  const messageText = `Your Sasya Khetr verification code is: ${otp}. It is valid for 5 minutes.`

  const isDummyPhone = !twilioPhone || 
    twilioPhone.trim() === '' || 
    twilioPhone.toLowerCase().includes('your_phone_number') || 
    twilioPhone.toLowerCase().includes('placeholder')

  if (client && !isDummyPhone) {
    try {
      let formattedPhone = toPhone.trim()
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.length === 10) {
          formattedPhone = `+91${formattedPhone}`
        } else {
          formattedPhone = `+${formattedPhone}`
        }
      }

      await client.messages.create({
        body: messageText,
        from: twilioPhone,
        to: formattedPhone
      })
      console.log(`[Twilio SMS Success] Sent OTP code to ${formattedPhone}`)
      return true
    } catch (err: any) {
      console.error('[Twilio SMS Error] Failed to send SMS via Twilio:', err)
      // Fallback to console log and debug file
      writeToLocalDebugLog(toPhone, otp, messageText, 'Twilio SMS Error')
      return false
    }
  } else {
    const reason = isDummyPhone ? 'Dummy Phone Number' : 'Twilio Config Missing'
    console.warn(`[Twilio SMS Config Missing/Dummy] TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER is placeholder or not set.`)
    writeToLocalDebugLog(toPhone, otp, messageText, reason)
    return true
  }
}
