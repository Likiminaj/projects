/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   parser_create_nodes.c                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/25 11:21:27 by lraghave          #+#    #+#             */
/*   Updated: 2026/02/11 16:55:38 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

t_ast	*ft_build_ast_node(t_ast_type type, int *exit_status);
void	ft_free_ast(t_ast *node);
void	ft_malloc_error(int *exit_status);

t_ast	*ft_build_ast_node(t_ast_type type, int *exit_status)
{
	t_ast	*node;

	node = malloc(sizeof(t_ast));
	if (!node)
		return (ft_malloc_error(exit_status), NULL);
	node->type = type;
	node->args = NULL;
	node->redirects = NULL;
	node->left = NULL;
	node->right = NULL;
	return (node);
}

void	ft_free_ast(t_ast *node)
{
	if (!node)
		return ;
	if (node->type == AST_PIPE)
	{
		ft_free_ast(node->left);
		ft_free_ast(node->right);
	}
	else if (node->type == AST_COMMAND)
	{
		ft_free_array(node->args);
		ft_free_redirects(node->redirects);
	}
	free(node);
}

