/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_isalpha.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/28 11:31:58 by cpesty            #+#    #+#             */
/*   Updated: 2025/05/28 14:55:16 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// isalpha()
// checks for an alphabetic character; in the standard "C" locale, it is
// equivalent to (isupper(c) || islower(c)).  In some locales, there may
// be  additional  characters  for which isalpha() is true—letters which
// are neither uppercase nor lowercase.
// RETURN VALUE
// The values returned are nonzero if the character c  falls  into  the  tested
// class, and zero if not.

#include "libft.h"

int	ft_isalpha(int c)
{
	return ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z' ));
}
