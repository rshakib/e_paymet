export const globalSession = {
  isLoggedIn: false,
  currentLanguage: 'en' as 'en' | 'bn',
  // Dynamic registered user database (initially empty, updated upon registration or reset)
  registeredUser: {
    username: '', // Cleared hardcoded credentials
    pin: '',
    mobile: '',
    nid: '',
    fullName: '',
    dob: '',
    k1: undefined as string | undefined,
    k2: undefined as string | undefined,
    bp: undefined as string | undefined,
    last_t: undefined as number | undefined,
  }
};

