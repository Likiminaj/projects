/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_isalnum.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/10 18:33:23 by lraghave          #+#    #+#             */
/*   Updated: 2025/05/21 20:23:45 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

int	ft_isalnum(int c)
{
	return ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
		|| (c >= '0' && c <= '9'));
}

/*
#include <stdio.h>

int main(void)
{
    printf("A: %d\n", ft_isalnum('A')); // 1
    printf("z: %d\n", ft_isalnum('z')); // 1
    printf("5: %d\n", ft_isalnum('5')); // 0
    printf("#: %d\n", ft_isalnum('#')); // 0
    return 0;
}
*/
