import { SigninFormData, SignupFormData } from "@/d.type";

export function validateSignupFormData(formData : SignupFormData) {
    const errors = {
        username: "",
        email: "",
        password: ""
    };
    for (const key in formData) {
        if (!formData[key as keyof SignupFormData]) {
            errors[key as keyof SignupFormData] = key.charAt(0).toUpperCase() + `${key} is required`.slice(1);
        }
    }
    if (!errors.username) {
        if (formData.username.length < 6 || formData.username.length > 25) {
            errors.username = "Username must be between 6 and 25 characters";
        } 
        else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
            errors.username = "Username must contain only letters and numbers";
        }
    }
    if (!errors.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        } else if (formData.email.length > 50) {
            errors.email = "Email must not exceed 50 characters";
        }
    }
    if (!errors.password) {
        if (formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters";
        }
    }
    return errors;
}

export function validateSigninFormData(formData: SigninFormData): SigninFormData {
    const errors = {
        username: "",
        password: ""
    };
    
    if (!formData.username.trim()) {
        errors.username = "This field is required";
    }
    
    if (!formData.password) {
        errors.password = "This fielđ is required";
    }
    
    return errors;
}