/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_wordlen.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/21 19:06:23 by lraghave          #+#    #+#             */
/*   Updated: 2026/01/21 21:27:49 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

int	ft_wordlen(char *str, int i)
{
	int	start;
	char	quote;

	start = i;
	while (str[i] && !ft_isspace(str[i]) && !ft_isoperator(str[i]))
	{	
		if (str[i] == '\'' || str[i] == '"')
		{
			quote = str[i];
			i++;
			while (str[i] && str[i] != quote)
				i++;
			if (str[i] != quote)
				return (-1);
			i++;
		}
		else
			i++;
	}
	return (i - start);
}
