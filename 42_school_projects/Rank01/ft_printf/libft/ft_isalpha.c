/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_isalpha.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/10 18:33:23 by lraghave          #+#    #+#             */
/*   Updated: 2025/05/21 20:19:49 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

int	ft_isalpha(int c)
{
	return ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'));
}

/*
#include <stdio.h>

int main(void)
{
    printf("A: %d\n", ft_isalpha('A')); // 1
    printf("z: %d\n", ft_isalpha('z')); // 1
    printf("5: %d\n", ft_isalpha('5')); // 0
    printf("#: %d\n", ft_isalpha('#')); // 0
    return 0;
}
*/
