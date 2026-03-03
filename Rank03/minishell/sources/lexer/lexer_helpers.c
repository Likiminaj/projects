/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   lexer_helpers.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/21 16:01:32 by lraghave          #+#    #+#             */
/*   Updated: 2026/02/26 16:48:21 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

void	ft_free_tokens(t_token **list)
{
	t_token	*current;
	t_token	*next;

	if (!list || !*list)
		return ;
	current = *list;
	while (current)
	{
		next = current->next;
		free (current->word);
		free (current);
		current = next;
	}
	*list = NULL;
}

int	ft_token_len(t_token *tokens)
{
	int		i;
	t_token	*current;

	i = 0;
	if (!tokens)
		return (i);
	current = tokens;
	while (current)
	{
		i++;
		current = current -> next;
	}
	return (i);
}

t_token	*ft_new_word_tok(char *line, int i, int len, int *exit_status)
{
	t_token	*tok;
	char	*raw;

	tok = malloc(sizeof(t_token));
	if (!tok)
		return (ft_malloc_error(exit_status), NULL);
	raw = ft_substr(line, i, len);
	if (!raw)
		return (free(tok), ft_malloc_error(exit_status), NULL);
	tok->next = NULL;
	tok->type = TOKEN_WORD;
	tok->word = ft_strip_quotes(raw, exit_status);
	free(raw);
	return (tok);
}

char	*ft_strip_quotes(char *word, int *exit_status)
{
	char	*clean;
	int		i;
	int		j;
	char	quote;

	clean = ft_new_clean_word(word, exit_status);
	if (!clean)
		return (NULL);
	i = 0;
	j = 0;
	while (word[i])
	{
		if (word[i] == '\'' || word[i] == '"')
		{
			quote = word[i];
			i++;
			j += ft_copy_text(word, quote, &i, clean + j);
			if (word[i] == quote)
				i++;
		}
		else
			clean[j++] = word[i++];
	}
	clean[j] = '\0';
	return (clean);
}

char	*ft_new_clean_word(char *word, int *exit_status)
{
	char	*clean;

	clean = malloc(sizeof(char) * (ft_strlen(word) + 1));
	if (!clean)
		return (ft_malloc_error(exit_status), NULL);
	return (clean);
}
