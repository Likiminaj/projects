/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   parser.c                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/02 11:21:27 by lraghave          #+#    #+#             */
/*   Updated: 2026/03/11 17:40:41 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

// prototype(s)
t_ast	*ms_parse(t_token *tokens, int *exit_status);
t_ast	*ft_build_command(t_token **tokens, int *exit_status);

/* Converts token list into AST, handling pipes
to create tree structure. */
t_ast	*ms_parse(t_token *tokens, int *exit_status)
{
	t_ast	*ast;
	t_ast	*pipe;

	if (!tokens)
		return (NULL);
	ast = ft_build_command(&tokens, exit_status);
	if (!ast)
		return (NULL);
	while (tokens && tokens->type == TOKEN_PIPE)
	{
		tokens = tokens->next;
		pipe = ft_build_ast_node(AST_PIPE, exit_status);
		if (!pipe)
			return (ft_free_ast(ast), NULL);
		pipe->left = ast;
		pipe->right = ft_build_command(&tokens, exit_status);
		if (!pipe->right)
			return (ft_free_ast(pipe), NULL);
		ast = pipe;
	}
	return (ast);
}

/* Creates a command node with its arguments and redirections. */
t_ast	*ft_build_command(t_token **tokens, int *exit_status)
{
	t_ast	*node;
	t_token	*tmp;

	node = ft_build_ast_node(AST_COMMAND, exit_status);
	if (!node)
		return (NULL);
	tmp = *tokens;
	node->redirects = ft_build_redirects(&tmp, exit_status);
	if (!node->redirects && exit_status && *exit_status != 0)
		return (ft_free_ast(node), NULL);
	node->args = ft_build_args(tokens, exit_status);
	if (!node->args)
		return (ft_free_ast(node), NULL);
	return (node);
}
