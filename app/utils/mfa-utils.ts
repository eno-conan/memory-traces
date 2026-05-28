import { fetchAuthSession } from 'aws-amplify/auth';
import type { AmplifyUser } from '@/types/amplify-user';

// Group name constant for consistency
export const LAMBDA_EXECUTORS_GROUP = 'lambda-executors';

/**
 * Check if the current user is in a specific Cognito group
 * @param groupName - The group name to check
 * @returns Promise<boolean> - true if user is in the group
 */
export async function isUserInGroup(groupName: string): Promise<boolean> {
  try {
    const session = await fetchAuthSession();
    const groups = session.tokens?.idToken?.payload['cognito:groups'];

    if (!groups || !Array.isArray(groups)) {
      return false;
    }

    return groups.includes(groupName);
  } catch (error) {
    console.error('Error checking user group:', error);
    return false;
  }
}

/**
 * Check if MFA is required for the current user
 * Users in lambda-executors group must have MFA enabled
 */
export async function isMFARequired(): Promise<boolean> {
  return await isUserInGroup(LAMBDA_EXECUTORS_GROUP);
}

/**
 * Extract groups from ID token payload
 * This is a client-side helper that works with the user object from Authenticator
 */
export function getGroupsFromUser(user: AmplifyUser): string[] {
  try {
    // The Authenticator component may expose signInUserSession
    const groups = user?.signInUserSession?.idToken?.payload['cognito:groups'];

    if (!groups || !Array.isArray(groups)) {
      return [];
    }

    return groups;
  } catch (error) {
    console.error('Error extracting groups from user:', error);
    return [];
  }
}

// Dashboard / UI 用の軽量ユーザー型
type UserWithGroups = {
  'cognito:groups'?: string[];
};

/**
 * Check if user is in lambda-executors group (for Dashboard user object)
 */
export function isInLambdaExecutorsGroup(user?: UserWithGroups): boolean {
  if (!user) return false;

  return user['cognito:groups']?.includes(LAMBDA_EXECUTORS_GROUP) === true;
}
