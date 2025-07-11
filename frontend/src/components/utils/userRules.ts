export const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{}[\]:;"'<>,.?/~`|\\]).{8,}$/;

export const passwordRule = {
    pattern: passwordPattern,
    message: 'Debe tener al menos una letra mayúscula, una letra minúscula, un número, un carácter especial y mínimo 8 caracteres'
};
