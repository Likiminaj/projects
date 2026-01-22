/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_strncmp.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/10 18:33:23 by lraghave          #+#    #+#             */
/*   Updated: 2025/05/10 18:38:48 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

int	ft_strncmp(const char *s1, const char *s2, size_t n)
{
	size_t	i;

	if (n == 0)
		return (0);
	i = 0;
	while (i < n && s1[i] != '\0' && s1[i] == s2[i])
		i++;
	if (i == n)
		return (0);
	return ((unsigned char)s1[i] - (unsigned char)s2[i]);
}
/* Notes
Only check *s1 for null terminators ('\0') while looping due to optimization 
and logical equivalence as short-circuit evaluation makes checking *s2 
redundant. 

In the loop: If *s1 == '\0' (end of s1), the condition *s1 == *s2 will 
automatically fail if *s2 != '\0'.
→ No need to explicitly check *s2 because inequality is already detected.

If *s1 != '\0' but *s2 == '\0', then *s1 == *s2 evaluates to false (since *s1 
≠ '\0').
→ The loop stops naturally.
*/
