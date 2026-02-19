/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   parser.c                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/02 11:21:27 by lraghave          #+#    #+#             */
/*   Updated: 2026/02/19 17:17:13 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

// prototype(s)
t_ast	*ms_parse(t_token *tokens, int *exit_status);
t_ast	*ft_build_command(t_token **tokens, int *exit_status);
t_ast	*ft_build_pipeline(t_token **tokens, int *exit_status);


t_ast	*ms_parse(t_token *tokens, int *exit_status)
{
	t_ast	*root;

	if (!tokens)
		return (NULL);
	root = ft_build_pipeline(&tokens, exit_status);
	return (root);
}

t_ast	*ft_build_command(t_token **tokens, int *exit_status)
{
	t_ast	*node;
	t_token	*tmp;

	node = ft_build_ast_node(AST_COMMAND, exit_status);
	if (!node)
		return (NULL);
	tmp = *tokens;
	node->redirects = ft_build_redirects(&tmp, exit_status);
	if (exit_status && *exit_status != 0)
   		 return (ft_free_ast(node), NULL);
	tmp = *tokens;
	node->redirects = ft_build_redirects(&tmp, exit_status);
	if (!node->redirects && exit_status && *exit_status != 0)
		return (ft_free_ast(node), NULL);
	node->args = ft_build_args(tokens, exit_status);
	if (!node->args)
		return (ft_free_ast(node), NULL);
	return (node);
}

t_ast	*ft_build_pipeline(t_token **tokens, int *exit_status)
{
	t_ast	*left;
	t_ast	*pipe;

	left = ft_build_command(tokens, exit_status);
	if (!left)
		return (NULL);
	while (*tokens && (*tokens)->type == TOKEN_PIPE)
	{
		*tokens = (*tokens)->next;
		pipe = ft_build_ast_node(AST_PIPE, exit_status);
		if (!pipe)
			return (ft_free_ast(left), NULL);
		pipe->left = left;
		pipe->right = ft_build_command(tokens, exit_status);
		if (!pipe->right)
			return (ft_free_ast(pipe), NULL);
		left = pipe;
	}
	return (left);
}
