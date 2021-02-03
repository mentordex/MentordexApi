exports.availableLangs = ['es', 'en']

exports.messages = {
    en: {
        // Error messages
        "ACCOUNT-NOT-REGISTERD": "Account does not registered in our system.",
        "PASSWORD-RESET-TOKEN": "Token is not valid or expired. Please try with valid link.",
        "PASSWORD-MISMATCH": "Password does not match",
        "EMAIL-EXIST": "Email address already registered.",
        "SYSTEM-ERROR": "Sorry!! We could not save your information due to some internal system error. Please try in few minutes.",
        "EMAIL-SENT": "Your password recovery email was sent.",
        "USER-ID-REQUIRED": "User id is not attached with request.",
        "TOKEN-ID-REQUIRED": "Token is not attached with request.",
        "TITLE-REQUIRED": "'title' is required.",
        "CITY-ID-REQUIRED": "'city' is required.",
        "CITY-ID-SHOULD-NOT-EMPTY": "'city' can not be empty.",
        "CITY-ALREADY-EXIST": "Entered city is already exist.",
        "CATEGORY-ALREADY-EXIST": "Entered category is already exist.",
        "OTP-INVALID": "Invalid OTP.",
        "EMAIL-VERIFY-FAILED": "Failed to verify your email.",
        "PROPERTY-ADDED": "Your property information has been added successfully.",
        "NO-RECORD-FOUND": "No Record Found",
        "CONTACT-REQUEST": "New Contact Request",
        "OLD-NEW-PASSWORD-MISMATCH": "Old password does not match.",
        "USE-ANOTHER-PASSWORD": "You can not use previous password as new password.",
        "TYPE-ALREADY-EXIST": "Type already exist in our system.",
        "NO-PROPERTY-FOUND": "Sorry!! could not find the property.",
        "USER-NOT-ACTIVE": "Sorry!! You are not a active user. Please contact to admin.",
        'emailRequiredField': "'email/Phone Number' is a required field.",
        'emailIsEmail': "This is not a valid email address.",
        'passwordRequiredField': "'password' is a required field.",

        // Success messages
        'loginSuccessful': "You've successfully logged in.",
        'emailSent': "Your password recovery email was sent.",

        "REGISTER-SUCCESSFULL": "Welcome email",
        "YOU-ARE-IN": "You’re in!",
        "FORGOT-PASSWORD": "Forgot Password",


        //Required
        "CATEGORY-ID-REQUIRED": "'Category' is required.",
        "CATEGORY-ID-SHOULD-NOT-EMPTY": "'Category' can not be empty.",
        "COUNTRY-ID-SHOULD-NOT-EMPTY":"'Country' can not be empty",
        "CITY-ID-SHOULD-NOT-EMPTY":"'City' can not be empty",
        "IMAGE-REQUIRED":"Image is required and can not be empty",
        "COUNTRY-ID-REQUIRED":"Country is requuired",
        "STATE-ID-REQUIRED":"State is requuired",
        "STATUS-ID-REQUIRED":"Status is requuired",
        
        "IMAGE-REQUIRED": "Image is required and cvan not be empty"
    },
    es: {
        // Mensajes de error
        'emailRequiredField': "'email/Phone Number' es un campo requerido.",
        'emailIsEmail': "Este no es un email válido.",
        'passwordRequiredField': "'password' es un campo requerido.",

        // Mensajes de éxito
        'loginSuccessful': "Has iniciado sesión exitosamente.",
        'emailSent': "Tu correo de recuperación de contraseña ha sido enviado."
    }
}