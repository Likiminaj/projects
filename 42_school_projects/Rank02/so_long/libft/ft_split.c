/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_split.c                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/10 18:49:13 by lraghave          #+#    #+#             */
/*   Updated: 2025/06/02 16:34:48 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

// Prototype
static size_t	ft_numofwrds(char const *s, char c);
static char		**ft_strsplit(char **strings, const char *s, char c);
static void		ft_free(char **s);

char	**ft_split(char const *s, char c)
{
	size_t	num_of_words;
	size_t	i;
	char	**strings;
	char	**temp;

	if (!s)
		return (NULL);
	num_of_words = ft_numofwrds(s, c) + 1;
	strings = malloc(num_of_words * sizeof(char *));
	if (!strings)
		return (NULL);
	i = 0;
	while (i < num_of_words)
	{
		strings[i] = NULL;
		i++;
	}
	temp = ft_strsplit(strings, s, c);
	if (!temp)
	{
		ft_free(strings);
		return (NULL);
	}
	return (temp);
}

static void	ft_free(char **s)
{
	size_t	i;

	i = 0;
	while (s[i])
	{
		free(s[i]);
		i++;
	}
	free (s);
}

static char	**ft_strsplit(char **strings, const char *s, char c)
{
	size_t	i;
	size_t	j;
	size_t	start;

	i = 0;
	j = 0;
	while (s[i])
	{
		if (s[i] != c && (i == 0 || (i > 0 && s[i - 1] == c)))
		{
			start = i;
			while (s[i] && s[i] != c)
				i++;
			strings[j] = ft_substr(s, start, i - start);
			if (!strings[j])
				return (NULL);
			j++;
		}
		else
			i++;
	}
	return (strings);
}

static size_t	ft_numofwrds(char const *s, char c)
{
	int	num_of_words;
	int	i;

	i = 0;
	num_of_words = 0;
	while (s[i])
	{
		if (s[i] != c && (i == 0 || s[i - 1] == c))
			num_of_words++;
		i++;
	}
	return (num_of_words);
}
