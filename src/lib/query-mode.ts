import {useAuth} from './auth';
import {isFixtureMode} from './fixtures';
export function useLiveEnabled(){const {token,bootstrapped}=useAuth();return bootstrapped&&Boolean(token)&&!isFixtureMode()}
