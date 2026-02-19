/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   parser_create_redirects.c                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/02 11:21:27 by lraghave          #+#    #+#             */
/*   Updated: 2026/02/11 16:56:11 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

t_redirect				*ft_build_redirects(t_token **tokens, int *exit_status);
static t_redirect		*ft_build_redirect(t_token *token, int *exit_status);
static t_redirect_type	ft_redirect_type(t_token_type type);
static int				ft_is_redir(t_token_type t);

t_redirect	*ft_build_redirects(t_token **tokens, int *exit_status)
{
	t_redirect	*head;
	t_redirect	*temp;
	t_redirect	*new;

	head = NULL;
	temp = NULL;
	while (*tokens && (*tokens)->type != TOKEN_PIPE)
	{
		if (ft_is_redir((*tokens)->type))
		{
			new = ft_build_redirect(*tokens, exit_status);
			if (!new)
				return (ft_free_redirects(head), NULL);
			if (!head)
				head = new;
			else
				temp->next = new;
			temp = new;
			*tokens = (*tokens)->next;
			if (*tokens)
				*tokens = (*tokens)->next;
			continue ;
		}
		*tokens = (*tokens)->next;
	}
	return (head);
}

static t_redirect	*ft_build_redirect(t_token *token, int *exit_status)
{
	t_redirect	*redir;

	if (!token || !token->next || !token->next->word)
	{
		ft_putendl_fd("minishell: syntax error near redirect", 2);
		if (exit_status)
			*exit_status = 2;
		return (NULL);
	}
	redir = malloc(sizeof(t_redirect));
	if (!redir)
		return (ft_malloc_error(exit_status), NULL);
	redir->type = ft_redirect_type(token->type);
	redir->next = NULL;
	redir->file = ft_strdup(token->next->word);
	if (!redir->file)
	{
		free(redir);
		return (ft_malloc_error(exit_status), NULL);
	}
	return (redir);
}

static t_redirect_type	ft_redirect_type(t_token_type type)
{
	if (type == TOKEN_REDIRECT_IN)
		return (REDIR_IN);
	if (type == TOKEN_REDIRECT_OUT)
		return (REDIR_OUT);
	if (type == TOKEN_REDIRECT_APPEND)
		return (REDIR_APPEND);
	return (REDIR_HEREDOC);
}

static int	ft_is_redir(t_token_type t)
{
	return (t == TOKEN_REDIRECT_IN
		|| t == TOKEN_REDIRECT_OUT
		|| t == TOKEN_REDIRECT_APPEND
		|| t == TOKEN_HEREDOC);
}
