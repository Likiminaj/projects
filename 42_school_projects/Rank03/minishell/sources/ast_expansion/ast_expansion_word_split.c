/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ast_expansion_word_split.c                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/20 18:00:00 by chlpesty          #+#    #+#             */
/*   Updated: 2026/03/20 19:45:55 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		ft_word_split(char ***args, int i, int count);
int		count_split_words(char *s);
char	**split_words(char *s, int wc);
char	**rebuild_args(char **args, int i, int count, char **words);
char	*protect_spaces(char *s);

/* Splits args[i] on unprotected spaces. Returns added count
which is the number of new words created - 1. */
int	ft_word_split(char ***args, int i, int count)
{
	int		wc;
	char	**words;
	char	**new_args;

	wc = count_split_words((*args)[i]);
	if (wc <= 1)
		return (0);
	words = split_words((*args)[i], wc);
	if (!words)
		return (-1);
	new_args = rebuild_args(*args, i, count, words);
	free(words);
	if (!new_args)
		return (-1);
	free(*args);
	*args = new_args;
	return (wc - 1);
}

/* Counts real-space-separated words in s (ignores \x02 protected spaces). */
int	count_split_words(char *s)
{
	int	count;
	int	in_word;

	count = 0;
	in_word = 0;
	while (*s)
	{
		if (*s == ' ')
			in_word = 0;
		else if (!in_word)
		{
			in_word = 1;
			count++;
		}
		s++;
	}
	if (count > 0)
		return (count);
	return (1);
}

/* Splits s on real spaces, returns NULL-terminated array of word strings. */
char	**split_words(char *s, int wc)
{
	char	**words;
	int		i;
	int		len;

	words = malloc(sizeof(char *) * (wc + 1));
	if (!words)
		return (NULL);
	i = 0;
	while (*s && i < wc)
	{
		while (*s == ' ')
			s++;
		len = 0;
		while (s[len] && s[len] != ' ')
			len++;
		words[i++] = ft_substr(s, 0, len);
		s += len;
	}
	words[i] = NULL;
	return (words);
}

/* Builds new args array replacing args[i] with words from words[]. */
char	**rebuild_args(char **args, int i, int count, char **words)
{
	char	**new_args;
	int		j;
	int		k;

	k = 0;
	while (words[k])
		k++;
	new_args = malloc(sizeof(char *) * (count + k));
	if (!new_args)
		return (NULL);
	j = 0;
	k = 0;
	while (k < i)
		new_args[j++] = args[k++];
	free(args[i]);
	k = 0;
	while (words[k])
		new_args[j++] = words[k++];
	k = i + 1;
	while (k < count)
		new_args[j++] = args[k++];
	new_args[j] = NULL;
	return (new_args);
}

/* Replaces spaces in s with \x02 (literal space sentinel). Frees input. */
char	*protect_spaces(char *s)
{
	char	*result;
	int		i;
	int		j;

	result = malloc(ft_strlen(s) + 1);
	if (!result)
		return (free(s), NULL);
	i = 0;
	j = 0;
	while (s[i])
	{
		if (s[i] == ' ')
			result[j++] = '\x02';
		else
			result[j++] = s[i];
		i++;
	}
	result[j] = '\0';
	free(s);
	return (result);
}
